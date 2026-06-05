"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

// ── Types ──────────────────────────────────────────────────
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
// CONCRETE TEXTURE (procedural)
// ═══════════════════════════════════════════════════════════
function createConcreteTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // Base gray
  ctx.fillStyle = "#3a3a3e";
  ctx.fillRect(0, 0, size, size);

  // Noise pattern for concrete
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 3 + 0.5;
    const v = 58 + Math.random() * 15;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cracks
  ctx.strokeStyle = "#2a2a2e";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    let sx = Math.random() * size;
    let sy = Math.random() * size;
    ctx.moveTo(sx, sy);
    for (let j = 0; j < 6; j++) {
      sx += (Math.random() - 0.5) * 120;
      sy += (Math.random() - 0.5) * 120;
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

// ═══════════════════════════════════════════════════════════
// INDUSTRIAL SCENE SETUP
// ═══════════════════════════════════════════════════════════
function setupIndustrialScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): THREE.Texture {
  // Dark industrial background
  scene.background = new THREE.Color("#0d0d12");
  scene.fog = new THREE.Fog("#0d0d12", 2.5, 15);

  // Concrete floor
  const concreteTex = createConcreteTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.85,
      metalness: 0.05,
      color: "#555560",
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Studio environment for reflections
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(
    new THREE.SphereGeometry(8, 32, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: `varying vec3 w;void main(){vec4 p=modelMatrix*vec4(position,1.);w=p.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 w;void main(){float h=normalize(w).y;float t=smoothstep(-0.2,0.7,h);gl_FragColor=vec4(mix(vec3(0.02,0.02,0.04),vec3(0.14,0.14,0.18),t),1.);}`,
    })
  ));
  const pg = new THREE.PlaneGeometry(3, 2);
  const pm = new THREE.MeshBasicMaterial({ color: "#fff", side: THREE.DoubleSide });
  [[4,1.5,2.5,0,-0.4],[-3,1,1,0,1],[0,5,0,-1.57,0],[1,-1,2,0.3,0],[-1,2,-2,0,2.2]]
    .forEach(([px,py,pz,rx,ry]) => {
      const p = new THREE.Mesh(pg, pm);
      p.position.set(px, py, pz);
      p.rotation.set(rx, ry, 0);
      envScene.add(p);
    });
  const env = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.02).texture;
  pg.dispose(); pm.dispose(); envScene.clear();
  scene.environment = env;

  // Lighting — industrial overhead + accent
  scene.add(new THREE.AmbientLight("#445566", 0.5));
  const key = new THREE.DirectionalLight("#ffffff", 4.0);
  key.position.set(2, 5, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight("#8899bb", 1.2);
  fill.position.set(-2, 1.5, 1);
  scene.add(fill);
  const rim = new THREE.DirectionalLight("#667788", 1.5);
  rim.position.set(0, -0.5, -3);
  scene.add(rim);
  const accent = new THREE.PointLight("#ec4899", 2, 6);
  accent.position.set(3, 1, -1);
  scene.add(accent);

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
        color: isWhite ? "#f5f5f8" : "#1a1a1e",
        metalness: 0.03,
        roughness: isWhite ? 0.2 : 0.12,
        clearcoat: 0.55,
        clearcoatRoughness: 0.05,
        envMap,
        envMapIntensity: 1.0,
      });
      c.receiveShadow = true;
      c.castShadow = true;
    }
  });
}

// ═══════════════════════════════════════════════════════════
// VINYL DECAL MATERIAL (die-cut premium)
// ═══════════════════════════════════════════════════════════
function createVinylMat(finish: Finish, envMap: THREE.Texture): THREE.MeshStandardMaterial {
  const roughness = finish === "Fosco" ? 0.3 : finish === "Brilhante" ? 0.12 : 0.10;
  const metalness = finish === "Refletivo" ? 0.7 : finish === "Holográfico" ? 0.5 : 0.03;
  const emissive = finish === "Holográfico" ? "#8b5cf6" : "#000";
  const emissiveIntensity = finish === "Holográfico" ? 0.12 : 0;

  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    map: null,
    transparent: true,
    alphaTest: 0.01,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -4,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
    envMap: metalness > 0.3 ? envMap : null,
    envMapIntensity: metalness > 0.3 ? 0.8 : 0,
    side: THREE.DoubleSide,
  });

  return mat;
}

// ═══════════════════════════════════════════════════════════
// RAYCAST DIRECTIONS
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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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

  // ── Load texture with max sharpness ────────────────────
  const loadTex = useCallback((url: string): Promise<THREE.Texture> => {
    return new Promise((resolve) => {
      texLoaderRef.current.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.premultiplyAlpha = true;
        tex.needsUpdate = true;
        resolve(tex);
      });
    });
  }, []);

  // ── Get image aspect ────────────────────────────────────
  const getAspect = useCallback((url: string): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width / Math.max(img.height, 1));
      img.onerror = () => resolve(1);
      img.src = url;
    });
  }, []);

  // ── Place decal ──────────────────────────────────────────
  const placeDecal = useCallback(async (
    hitPoint: THREE.Vector3, hitNormal: THREE.Vector3
  ) => {
    if (!sceneRef.current || !textureUrl || !envRef.current) return;

    // Remove old
    if (decalRef.current) {
      sceneRef.current.remove(decalRef.current);
      decalRef.current.geometry.dispose();
      const m = decalRef.current.material as THREE.MeshStandardMaterial;
      if (m.map) m.map.dispose();
      m.dispose();
      decalRef.current = null;
    }

    const normal = hitNormal.clone().normalize();
    const base = decalScale * 0.55;
    const aspect = await getAspect(textureUrl);
    const w = aspect >= 1 ? base : base * aspect;
    const h = aspect >= 1 ? base / aspect : base;

    const geo = new THREE.PlaneGeometry(w, h);
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    const mat = createVinylMat(finishType, envRef.current);
    const decal = new THREE.Mesh(geo, mat);
    decal.position.copy(hitPoint.clone().add(normal.clone().multiplyScalar(0.025)));
    decal.quaternion.copy(quat);
    decal.name = "decal";
    decal.renderOrder = 1;

    const tex = await loadTex(textureUrl);
    mat.map = tex;
    mat.needsUpdate = true;

    sceneRef.current.add(decal);
    decalRef.current = decal;
  }, [textureUrl, decalScale, finishType, loadTex, getAspect]);

  // ── Raycast ──────────────────────────────────────────────
  const raycastPlace = useCallback((dir: THREE.Vector3) => {
    if (!modelRef.current || !textureUrl) return;
    const d = dir.clone().normalize();
    const rc = new THREE.Raycaster();
    rc.set(d.clone().multiplyScalar(-5), d);
    rc.far = 10;
    const hits = rc.intersectObjects(modelRef.current.children, true);
    if (hits.length > 0) {
      placeDecal(hits[0].point, hits[0].face?.normal || d.clone().multiplyScalar(-1));
    }
  }, [textureUrl, placeDecal]);

  // ── Triggers ─────────────────────────────────────────────
  useEffect(() => {
    if (!textureUrl || status !== "ready") return;
    const d = RAY_DIR[decalPosition];
    if (d) { const t = setTimeout(() => raycastPlace(d), 200); return () => clearTimeout(t); }
  }, [textureUrl, decalPosition, finishType, status]);

  useEffect(() => {
    if (!textureUrl || status !== "ready") return;
    const d = RAY_DIR[decalPosition];
    if (d) { const t = setTimeout(() => raycastPlace(d), 50); return () => clearTimeout(t); }
  }, [decalScale]);

  // ── Init ────────────────────────────────────────────────
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
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.sortObjects = true;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const envMap = setupIndustrialScene(scene, renderer);
    envRef.current = envMap;

    const camera = new THREE.PerspectiveCamera(38, 1.2, 0.1, 20);
    camera.position.set(0, 0.4, 3.8);
    cameraRef.current = camera;

    new OBJLoader().load("/models/capacete.obj",
      (obj) => {
        const box = new THREE.Box3().setFromObject(obj);
        const c = box.getCenter(new THREE.Vector3());
        const s = 2.0 / box.getSize(new THREE.Vector3()).length();
        obj.scale.setScalar(s);
        obj.position.set(-c.x * s, -c.y * s + 0.15, -c.z * s);
        applyPBR(obj, helmetColor, envMap);
        scene.add(obj);
        modelRef.current = obj;
        setStatus("ready");
      },
      undefined,
      () => setStatus("error")
    );

    // Drag
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

  // Color
  useEffect(() => {
    if (!modelRef.current || !envRef.current) return;
    applyPBR(modelRef.current, helmetColor, envRef.current);
  }, [helmetColor]);

  if (!mounted) return <div className={className} style={{ background: "#0d0d12" }} />;
  if (status === "error") {
    return <div className={className} style={{ background:"#0d0d12", display:"flex", alignItems:"center", justifyContent:"center", color:"#666", fontSize:13 }}>Erro ao carregar modelo</div>;
  }

  return (
    <div ref={containerRef} className={className} style={{ position:"relative", minHeight:480, background:"#0d0d12" }}>
      {status === "loading" && (
        <div style={{ position:"absolute", inset:0, zIndex:30, display:"flex", alignItems:"center", justifyContent:"center", background:"#0d0d12" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"2px solid #333", borderTopColor:"#ec4899", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
            <p style={{ color:"#666", fontSize:13 }}>Carregando...</p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display:"block", width:"100%", height:"100%", cursor:"grab" }} />
    </div>
  );
}
