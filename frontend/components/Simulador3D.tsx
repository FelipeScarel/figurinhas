"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

// ── Props ──────────────────────────────────────────────────
interface Props {
  textureUrl: string | null;
  helmetColor: "white" | "black";
  decalScale: number;
  className?: string;
}

// ═══════════════════════════════════════════════════════════
// STUDIO ENVIRONMENT
// ═══════════════════════════════════════════════════════════
function createStudioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const s = new THREE.Scene();
  const h = new THREE.Mesh(
    new THREE.SphereGeometry(8, 32, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: `varying vec3 w;void main(){vec4 p=modelMatrix*vec4(position,1.);w=p.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 w;void main(){float h=normalize(w).y;float t=smoothstep(-0.2,0.7,h);gl_FragColor=vec4(mix(vec3(.03),vec3(.18),t),1.);}`,
    })
  );
  s.add(h);
  const pg = new THREE.PlaneGeometry(3, 2);
  const pm = new THREE.MeshBasicMaterial({ color: "#fff", side: THREE.DoubleSide });
  [
    [4, 1.5, 2.5, 0, -0.4],
    [-3, 1, 1, 0, 1],
    [0, 5, 0, -1.57, 0],
    [1, -1, 2, 0.3, 0],
    [-1, 2, -2, 0, 2.2],
  ].forEach(([px, py, pz, rx, ry]) => {
    const p = new THREE.Mesh(pg, pm);
    p.position.set(px, py, pz);
    p.rotation.set(rx, ry, 0);
    s.add(p);
  });
  const env = new THREE.PMREMGenerator(renderer).fromScene(s, 0.02).texture;
  pg.dispose();
  pm.dispose();
  s.clear();
  return env;
}

// ═══════════════════════════════════════════════════════════
// APPLY PBR MATERIALS TO LOADED MODEL
// ═══════════════════════════════════════════════════════════
function applyPBRMaterials(
  obj: THREE.Group,
  color: "white" | "black",
  envMap: THREE.Texture
) {
  const isWhite = color === "white";
  const mainColor = isWhite ? "#f0f0f2" : "#1a1a1e";
  const accentColor = isWhite ? "#e0e0e4" : "#252530";

  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshPhysicalMaterial({
        color: mainColor,
        metalness: 0.04,
        roughness: isWhite ? 0.25 : 0.14,
        clearcoat: 0.5,
        clearcoatRoughness: 0.06,
        envMap,
        envMapIntensity: 1.0,
      });
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Simulador3D({
  textureUrl,
  helmetColor,
  decalScale,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const decalRef = useRef<THREE.Mesh | null>(null);
  const envRef = useRef<THREE.Texture | null>(null);
  const animRef = useRef(0);
  const ptrRef = useRef({ x: 0, y: 0 });
  const tgtRef = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => setMounted(true), []);

  // ── Init ───────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      setStatus("error");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // Lights
    scene.add(new THREE.AmbientLight("#ffffff", 0.4));
    const key = new THREE.DirectionalLight("#ffffff", 3.0);
    key.position.set(3.5, 2.5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#ec4899", 1.0);
    fill.position.set(-2, 0.5, 1.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight("#8b5cf6", 1.5);
    rim.position.set(-0.5, -0.3, -2.5);
    scene.add(rim);
    const top = new THREE.DirectionalLight("#ffffff", 2.0);
    top.position.set(0, 5, 1);
    scene.add(top);

    // Load OBJ
    const loader = new OBJLoader();
    loader.load(
      "/models/capacete.obj",
      (obj) => {
        // Center & scale
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;
        obj.scale.setScalar(scale);
        obj.position.set(-center.x * scale, -center.y * scale + 0.1, -center.z * scale);

        applyPBRMaterials(obj, helmetColor, envMap);
        scene.add(obj);
        modelRef.current = obj;

        // Create decal plane positioned in front of the model
        // Use the bounding box to position the decal at the front center
        const frontZ = box.max.z * scale - center.z * scale + 0.02;
        const frontY = (box.max.y + box.min.y) / 2 * scale - center.y * scale + 0.1;
        const modelWidth = (box.max.x - box.min.x) * scale * 0.6;

        const decalGeo = new THREE.PlaneGeometry(modelWidth, modelWidth);
        const decalMat = new THREE.MeshStandardMaterial({
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
          visible: false,
          roughness: 0.15,
          metalness: 0,
          depthWrite: true,
        });
        const decal = new THREE.Mesh(decalGeo, decalMat);
        decal.position.set(0, frontY, frontZ);
        decal.name = "decal";
        decalRef.current = decal;
        scene.add(decal);

        setStatus("ready");
      },
      undefined,
      () => setStatus("error")
    );

    // Mouse
    function onPtr(e: PointerEvent) {
      const r = container.getBoundingClientRect();
      ptrRef.current.x = (e.clientX - r.left) / r.width - 0.5;
      ptrRef.current.y = (e.clientY - r.top) / r.height - 0.5;
    }
    container.addEventListener("pointermove", onPtr, { passive: true });

    // Resize
    function resize() {
      const r = container.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();

    // Loop
    function anim() {
      animRef.current = requestAnimationFrame(anim);
      if (!modelRef.current) { renderer.render(scene, camera); return; }
      tgtRef.current.x += (ptrRef.current.x * 0.4 - tgtRef.current.x) * 0.03;
      tgtRef.current.y += (-ptrRef.current.y * 0.22 - tgtRef.current.y) * 0.03;
      modelRef.current.rotation.y = tgtRef.current.x;
      modelRef.current.rotation.x = tgtRef.current.y;
      renderer.render(scene, camera);
    }
    anim();

    return () => {
      cancelAnimationFrame(animRef.current);
      container.removeEventListener("pointermove", onPtr);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, [mounted]);

  // ── Color change ────────────────────────────────────────
  useEffect(() => {
    if (!modelRef.current || !envRef.current) return;
    applyPBRMaterials(modelRef.current, helmetColor, envRef.current);
  }, [helmetColor]);

  // ── Texture ─────────────────────────────────────────────
  useEffect(() => {
    if (!decalRef.current) return;
    if (!textureUrl) {
      const decal = decalRef.current;
      const mat = decal.material as THREE.MeshStandardMaterial;
      if (mat.map) { mat.map.dispose(); mat.map = null; }
      mat.visible = false;
      mat.needsUpdate = true;
      return;
    }
    new THREE.TextureLoader().load(textureUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const decal = decalRef.current!;
      const mat = decal.material as THREE.MeshStandardMaterial;
      if (mat.map) mat.map.dispose();
      mat.map = tex;
      mat.visible = true;
      mat.needsUpdate = true;
      const s = Math.max(0.3, Math.min(2.0, decalScale));
      decal.scale.set(s, s, 1);
    });
  }, [textureUrl]);

  // ── Scale change ────────────────────────────────────────
  useEffect(() => {
    const decal = decalRef.current;
    if (!decal) return;
    const s = Math.max(0.3, Math.min(2.0, decalScale));
    decal.scale.set(s, s, 1);
  }, [decalScale]);

  // ── Render ─────────────────────────────────────────────
  if (!mounted) return <div className={className} style={{ background: "#0a0a0c" }} />;

  if (status === "error") {
    return (
      <div className={className} style={{ background: "#0a0a0c", display: "flex", alignItems: "center", justifyContent: "center", color: "#52525b", fontSize: 13 }}>
        Erro ao carregar o modelo 3D
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", minHeight: 480 }}>
      {status === "loading" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0c" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #27272a", borderTopColor: "#ec4899", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: "#52525b", fontSize: 13 }}>Carregando capacete...</p>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
