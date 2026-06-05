"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

// ── Props ──────────────────────────────────────────────────
type Finish = "Brilhante" | "Fosco" | "Refletivo" | "Holográfico";
type Position = "front" | "top" | "left" | "right" | "back";

interface Props {
  textureUrl: string | null;
  helmetColor: "white" | "black";
  decalScale: number;
  decalPosition: Position;
  finishType: Finish;
  onDecalPositionChange: (p: Position) => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════
// STUDIO ENVIRONMENT
// ═══════════════════════════════════════════════════════════
function createStudioEnv(r: THREE.WebGLRenderer): THREE.Texture {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(
    new THREE.SphereGeometry(8, 32, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: `varying vec3 w;void main(){vec4 p=modelMatrix*vec4(position,1.);w=p.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 w;void main(){float h=normalize(w).y;float t=smoothstep(-0.2,0.7,h);gl_FragColor=vec4(mix(vec3(.03),vec3(.18),t),1.);}`,
    })
  ));
  const pg = new THREE.PlaneGeometry(3, 2);
  const pm = new THREE.MeshBasicMaterial({ color: "#fff", side: THREE.DoubleSide });
  [[4,1.5,2.5,0,-0.4],[-3,1,1,0,1],[0,5,0,-1.57,0],[1,-1,2,0.3,0],[-1,2,-2,0,2.2]]
    .forEach(([px,py,pz,rx,ry]) => {
      const p = new THREE.Mesh(pg, pm);
      p.position.set(px, py, pz);
      p.rotation.set(rx, ry, 0);
      s.add(p);
    });
  const env = new THREE.PMREMGenerator(r).fromScene(s, 0.02).texture;
  pg.dispose(); pm.dispose(); s.clear();
  return env;
}

// ═══════════════════════════════════════════════════════════
// HELMET PBR
// ═══════════════════════════════════════════════════════════
function applyPBR(obj: THREE.Group, color: "white" | "black", envMap: THREE.Texture) {
  const isWhite = color === "white";
  obj.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.material = new THREE.MeshPhysicalMaterial({
        color: isWhite ? "#f0f0f2" : "#1a1a1e",
        metalness: 0.04,
        roughness: isWhite ? 0.25 : 0.14,
        clearcoat: 0.5,
        clearcoatRoughness: 0.06,
        envMap,
        envMapIntensity: 1.0,
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════
// DECAL MATERIAL (VINYL STICKER — Z-FIGHTING PROOF)
// ═══════════════════════════════════════════════════════════
function createDecalMat(finish: Finish, envMap: THREE.Texture): THREE.MeshStandardMaterial {
  const roughness = finish === "Fosco" ? 0.35 : finish === "Brilhante" ? 0.15 : 0.12;
  const metalness = finish === "Refletivo" ? 0.8 : finish === "Holográfico" ? 0.6 : 0.05;
  const emissive = finish === "Holográfico" ? "#8b5cf6" : "#000";
  const emissiveIntensity = finish === "Holográfico" ? 0.15 : 0;

  return new THREE.MeshStandardMaterial({
    map: null,
    transparent: true,
    alphaTest: 0.01,
    depthTest: true,
    depthWrite: false,           // don't write to depth → no z-fighting
    polygonOffset: true,
    polygonOffsetFactor: -4,     // aggressive offset: renders above helmet
    polygonOffsetUnits: -4,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
    envMap: metalness > 0.5 ? envMap : null,
    envMapIntensity: metalness > 0.5 ? 1.0 : 0,
    side: THREE.DoubleSide,
    color: "#ffffff",           // white base so texture shows true colors
  });
}

// ═══════════════════════════════════════════════════════════
// RAYCAST DIRECTIONS (normalized, pointing at helmet center)
// ═══════════════════════════════════════════════════════════
const RAY_DIR: Record<Position, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0.1, 1),
  top: new THREE.Vector3(0, 1, 0),
  left: new THREE.Vector3(-1, 0.1, 0),
  right: new THREE.Vector3(1, 0.1, 0),
  back: new THREE.Vector3(0, 0.1, -1),
};

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
export default function Simulador3D({
  textureUrl, helmetColor, decalScale, decalPosition,
  finishType, onDecalPositionChange, className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const decalRef = useRef<THREE.Mesh | null>(null);
  const envRef = useRef<THREE.Texture | null>(null);
  const texLoaderRef = useRef(new THREE.TextureLoader());
  const animRef = useRef(0);

  const rotRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, prevX: 0, prevY: 0 });
  const autoRef = useRef(true);

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => setMounted(true), []);

  // ── Load a texture with max sharpness ────────────────────
  const loadTextureSharp = useCallback((url: string): Promise<THREE.Texture> => {
    return new Promise((resolve) => {
      texLoaderRef.current.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        // MAX sharpness filters
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.premultiplyAlpha = true;
        tex.needsUpdate = true;
        resolve(tex);
      });
    });
  }, []);

  // ── Get image aspect ratio ───────────────────────────────
  const getImageAspect = useCallback((url: string): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width / Math.max(img.height, 1));
      img.onerror = () => resolve(1);
      img.src = url;
    });
  }, []);

  // ── Place decal ──────────────────────────────────────────
  const placeDecal = useCallback(async (
    hitPoint: THREE.Vector3,
    hitNormal: THREE.Vector3,
  ) => {
    if (!sceneRef.current || !textureUrl || !envRef.current) return;

    // Remove old
    if (decalRef.current) {
      sceneRef.current.remove(decalRef.current);
      decalRef.current.geometry.dispose();
      const oldMat = decalRef.current.material as THREE.MeshStandardMaterial;
      if (oldMat.map) oldMat.map.dispose();
      oldMat.dispose();
      decalRef.current = null;
    }

    const normal = hitNormal.clone().normalize();
    const baseSize = decalScale * 0.55;

    // Preserve aspect ratio
    const aspect = await getImageAspect(textureUrl);
    const w = aspect >= 1 ? baseSize : baseSize * aspect;
    const h = aspect >= 1 ? baseSize / aspect : baseSize;

    const geo = new THREE.PlaneGeometry(w, h);

    // Align plane with surface normal
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    const mat = createDecalMat(finishType, envRef.current);

    const decal = new THREE.Mesh(geo, mat);
    // Position: offset 0.03 units along normal (OUTSIDE the mesh)
    decal.position.copy(hitPoint.clone().add(normal.clone().multiplyScalar(0.03)));
    decal.quaternion.copy(quat);
    decal.name = "decal";
    decal.renderOrder = 1;       // render AFTER helmet

    // Load texture sharp
    const tex = await loadTextureSharp(textureUrl);
    mat.map = tex;
    mat.needsUpdate = true;

    sceneRef.current.add(decal);
    decalRef.current = decal;
  }, [textureUrl, decalScale, finishType, loadTextureSharp, getImageAspect]);

  // ── Raycast ──────────────────────────────────────────────
  const raycastPlace = useCallback((direction: THREE.Vector3) => {
    if (!modelRef.current || !textureUrl) return;
    const dir = direction.clone().normalize();
    const raycaster = new THREE.Raycaster();
    raycaster.set(dir.clone().multiplyScalar(-5), dir);
    raycaster.far = 10;
    const hits = raycaster.intersectObjects(modelRef.current.children, true);
    if (hits.length > 0) {
      placeDecal(hits[0].point, hits[0].face?.normal || dir.clone().multiplyScalar(-1));
    }
  }, [textureUrl, placeDecal]);

  // ── Re-place triggers ────────────────────────────────────
  useEffect(() => {
    if (!textureUrl || status !== "ready") return;
    const dir = RAY_DIR[decalPosition];
    if (dir) {
      const t = setTimeout(() => raycastPlace(dir), 200);
      return () => clearTimeout(t);
    }
  }, [textureUrl, decalPosition, finishType, status]);

  useEffect(() => {
    if (!textureUrl || status !== "ready") return;
    const dir = RAY_DIR[decalPosition];
    if (dir) {
      const t = setTimeout(() => raycastPlace(dir), 50);
      return () => clearTimeout(t);
    }
  }, [decalScale]);

  // ── Init scene ──────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, alpha: false,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch { setStatus("error"); return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.sortObjects = true;    // important: respects renderOrder
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0a0c");
    scene.fog = new THREE.Fog("#0a0a0c", 3, 14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, 1.2, 0.1, 20);
    camera.position.set(0, 0.4, 3.5);
    cameraRef.current = camera;

    const envMap = createStudioEnv(renderer);
    scene.environment = envMap;
    envRef.current = envMap;

    scene.add(new THREE.AmbientLight("#ffffff", 0.4));
    const key = new THREE.DirectionalLight("#ffffff", 3.0);
    key.position.set(3.5, 2.5, 4); scene.add(key);
    const fill = new THREE.DirectionalLight("#ec4899", 1.0);
    fill.position.set(-2, 0.5, 1.5); scene.add(fill);
    const rim = new THREE.DirectionalLight("#8b5cf6", 1.5);
    rim.position.set(-0.5, -0.3, -2.5); scene.add(rim);
    const topL = new THREE.DirectionalLight("#ffffff", 2.0);
    topL.position.set(0, 5, 1); scene.add(topL);

    new OBJLoader().load("/models/capacete.obj",
      (obj) => {
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = box.getSize(new THREE.Vector3()).length();
        const sc = 2.0 / maxDim;
        obj.scale.setScalar(sc);
        obj.position.set(-center.x * sc, -center.y * sc + 0.1, -center.z * sc);
        applyPBR(obj, helmetColor, envMap);
        scene.add(obj);
        modelRef.current = obj;
        setStatus("ready");
      },
      undefined,
      () => setStatus("error")
    );

    // ── Drag rotation ────────────────────────────────────
    function onDown(e: PointerEvent) {
      dragRef.current.active = true;
      dragRef.current.prevX = e.clientX;
      dragRef.current.prevY = e.clientY;
      autoRef.current = false;
      velRef.current.x = 0; velRef.current.y = 0;
      container.setPointerCapture(e.pointerId);
    }
    function onMove(e: PointerEvent) {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.prevX;
      const dy = e.clientY - dragRef.current.prevY;
      rotRef.current.y += dx * 0.005;
      rotRef.current.x += dy * 0.005;
      rotRef.current.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, rotRef.current.x));
      velRef.current.x = dy * 0.005;
      velRef.current.y = dx * 0.005;
      dragRef.current.prevX = e.clientX;
      dragRef.current.prevY = e.clientY;
    }
    function onUp() { dragRef.current.active = false; }

    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointerleave", onUp);

    function resize() {
      const r = container.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize); resize();

    function anim() {
      animRef.current = requestAnimationFrame(anim);
      if (!modelRef.current) { renderer.render(scene, camera); return; }
      if (!dragRef.current.active) {
        if (autoRef.current) rotRef.current.y += 0.003;
        else {
          rotRef.current.y += velRef.current.y;
          rotRef.current.x += velRef.current.x;
          velRef.current.y *= 0.95; velRef.current.x *= 0.95;
          if (Math.abs(velRef.current.y) < 1e-4) velRef.current.y = 0;
          if (Math.abs(velRef.current.x) < 1e-4) velRef.current.x = 0;
        }
        rotRef.current.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, rotRef.current.x));
      }
      modelRef.current.rotation.y = rotRef.current.y;
      modelRef.current.rotation.x = rotRef.current.x;
      renderer.render(scene, camera);
    }
    anim();

    return () => {
      cancelAnimationFrame(animRef.current);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointerleave", onUp);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, [mounted]);

  // ── Color change ────────────────────────────────────────
  useEffect(() => {
    if (!modelRef.current || !envRef.current) return;
    applyPBR(modelRef.current, helmetColor, envRef.current);
  }, [helmetColor]);

  // ── Render ─────────────────────────────────────────────
  if (!mounted) return <div className={className} style={{ background: "#0a0a0c" }} />;
  if (status === "error") {
    return <div className={className} style={{ background: "#0a0a0c", display:"flex", alignItems:"center", justifyContent:"center", color:"#52525b", fontSize:13 }}>Erro ao carregar modelo 3D</div>;
  }

  return (
    <div ref={containerRef} className={className} style={{ position:"relative", minHeight:480 }}>
      {status === "loading" && (
        <div style={{ position:"absolute", inset:0, zIndex:30, display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0a0c" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #27272a", borderTopColor:"#ec4899", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            <p style={{ color:"#52525b", fontSize:13 }}>Carregando capacete...</p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display:"block", width:"100%", height:"100%", cursor:"grab" }} />
    </div>
  );
}
