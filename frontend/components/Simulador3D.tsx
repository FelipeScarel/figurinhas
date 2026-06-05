"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import * as THREE from "three";

// ── Types ──────────────────────────────────────────────────
type ModelType = "capacete" | "capinha";

interface Simulador3DProps {
  textureUrl: string | null;
  modelType: ModelType;
  onModelChange: (m: ModelType) => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════
// PROCEDURAL PBR TEXTURES (Canvas2D)
// ═══════════════════════════════════════════════════════════

function createCarbonFiberTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base dark gray
  ctx.fillStyle = "#1a1a1e";
  ctx.fillRect(0, 0, size, size);

  // Carbon fiber weave pattern
  const w = 16;
  for (let y = 0; y < size; y += w) {
    for (let x = 0; x < size; x += w * 2) {
      const offset = (Math.floor(y / w) % 2) * w;
      // Dark strand
      ctx.fillStyle = "#141418";
      ctx.fillRect(x + offset, y, w - 1, w - 1);
      // Highlight
      ctx.fillStyle = "#222228";
      ctx.fillRect(x + offset + 2, y + 2, w - 5, 2);
      ctx.fillStyle = "#1c1c22";
      ctx.fillRect(x + offset + 2, y + 5, w - 5, w - 8);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

function createRoughnessMap(baseRoughness: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const v = Math.round(baseRoughness * 255);
  ctx.fillStyle = `rgb(${v},${v},${v})`;
  ctx.fillRect(0, 0, size, size);

  // Random micro-variation
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 4;
    const n = v + (Math.random() - 0.5) * 30;
    ctx.fillStyle = `rgb(${Math.round(n)},${Math.round(n)},${Math.round(n)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  return tex;
}

function createNormalMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Flat normal map base (128,128,255 = flat)
  ctx.fillStyle = "rgb(128,128,255)";
  ctx.fillRect(0, 0, size, size);

  // Micro-bumps
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 3;
    const dx = Math.round(128 + (Math.random() - 0.5) * 20);
    const dy = Math.round(128 + (Math.random() - 0.5) * 20);
    ctx.fillStyle = `rgb(${dx},${dy},255)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  return tex;
}

// ═══════════════════════════════════════════════════════════
// ENVIRONMENT MAP (Studio lighting)
// ═══════════════════════════════════════════════════════════

function createEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000000");

  // Hemisphere gradient for sky/ground
  const hemiGeo = new THREE.SphereGeometry(10, 32, 32);
  const hemiMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos).y;
        float t = smoothstep(-0.2, 0.6, h);
        vec3 sky = mix(vec3(0.02, 0.02, 0.04), vec3(0.1, 0.1, 0.15), t);
        vec3 ground = mix(vec3(0.05, 0.05, 0.06), vec3(0.15, 0.15, 0.17), t);
        gl_FragColor = vec4(mix(ground, sky, t), 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(hemiGeo, hemiMat));

  // Soft light panels
  const panelGeo = new THREE.PlaneGeometry(2, 1.5);
  const panelMat = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });
  [
    { pos: [3, 1, 2], rot: [0, -0.5, 0] },
    { pos: [-3, 0.5, 1], rot: [0, 1.2, 0] },
    { pos: [0, 4, 0], rot: [-Math.PI / 2, 0, 0] },
    { pos: [0, -1, 2], rot: [0.3, 0, 0] },
    { pos: [2, -0.5, -2], rot: [0, 2.5, 0] },
  ].forEach(({ pos, rot }) => {
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(pos[0], pos[1], pos[2]);
    panel.rotation.set(rot[0], rot[1], rot[2]);
    panel.scale.set(1, 1, 1);
    scene.add(panel);
  });

  // Pink accent light
  const pinkGeo = new THREE.PlaneGeometry(1, 0.8);
  const pinkMat = new THREE.MeshBasicMaterial({ color: "#ec4899", side: THREE.DoubleSide });
  const pinkPanel = new THREE.Mesh(pinkGeo, pinkMat);
  pinkPanel.position.set(-1.5, 1.5, -2);
  pinkPanel.rotation.set(0, 0.8, 0);
  scene.add(pinkPanel);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(scene, 0.04).texture;
  scene.clear();
  hemiGeo.dispose();
  hemiMat.dispose();
  panelGeo.dispose();
  panelMat.dispose();
  pinkGeo.dispose();
  pinkMat.dispose();
  pmrem.dispose();

  return envMap;
}

// ═══════════════════════════════════════════════════════════
// PHOTOREALISTIC HELMET
// ═══════════════════════════════════════════════════════════

function createHelmet(envMap: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const carbonTex = createCarbonFiberTexture();
  const roughnessTex = createRoughnessMap(0.15);
  const normalTex = createNormalMap();

  // ── Main Shell (glossy carbon) ──
  const shellGeo = new THREE.SphereGeometry(1.15, 96, 64, 0, Math.PI * 2, 0, Math.PI * 0.66);
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: "#1a1a1e",
    metalness: 0.1,
    roughness: 0.18,
    roughnessMap: roughnessTex,
    map: carbonTex,
    normalMap: normalTex,
    normalScale: new THREE.Vector2(0.3, 0.3),
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    envMap: envMap,
    envMapIntensity: 0.9,
  });
  group.add(new THREE.Mesh(shellGeo, shellMat));

  // ── Stripe (glossy metallic pink) ──
  const stripeGeo = new THREE.TorusGeometry(0.96, 0.06, 32, 100, Math.PI);
  const stripeMat = new THREE.MeshPhysicalMaterial({
    color: "#ec4899",
    metalness: 0.4,
    roughness: 0.12,
    emissive: "#ec4899",
    emissiveIntensity: 0.25,
    clearcoat: 0.5,
    clearcoatRoughness: 0.05,
    envMap: envMap,
    envMapIntensity: 0.8,
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, 0.35, 1.08);
  stripe.rotation.set(0.15, 0, 0);
  group.add(stripe);

  // ── Visor (dark tinted glass) ──
  const visorGeo = new THREE.SphereGeometry(1.0, 64, 40, 0, Math.PI * 2, 0, 0.48);
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: "#0a0a14",
    metalness: 0.05,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMap: envMap,
    envMapIntensity: 1.2,
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.2, 0.95);
  visor.rotation.set(0.1, 0, 0);
  group.add(visor);

  // ── Visor Frame (matte black rubber) ──
  const frameGeo = new THREE.TorusGeometry(0.89, 0.025, 16, 80, Math.PI * 0.82);
  const frameMat = new THREE.MeshStandardMaterial({
    color: "#1c1c22",
    metalness: 0.05,
    roughness: 0.55,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, -0.05, 1.1);
  frame.rotation.set(0.2, 0, 0);
  group.add(frame);

  // ── Bottom Rim (matte trim) ──
  const btmGeo = new THREE.TorusGeometry(1.0, 0.05, 20, 80);
  const btmMat = new THREE.MeshStandardMaterial({
    color: "#222228",
    metalness: 0.05,
    roughness: 0.5,
  });
  const btm = new THREE.Mesh(btmGeo, btmMat);
  btm.position.set(0, -0.72, 0);
  group.add(btm);

  // ── Chin bar ──
  const chinGeo = new THREE.SphereGeometry(0.78, 48, 32, 0, Math.PI * 2, 0.38, 0.32);
  const chinMat = new THREE.MeshPhysicalMaterial({
    color: "#1c1c22",
    metalness: 0.08,
    roughness: 0.2,
    roughnessMap: roughnessTex,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    envMap: envMap,
    envMapIntensity: 0.7,
  });
  const chin = new THREE.Mesh(chinGeo, chinMat);
  chin.position.set(0, -0.55, 0.78);
  chin.rotation.set(0.28, 0, 0);
  group.add(chin);

  // ── Top Vent Detail ──
  const ventGeo = new THREE.TorusGeometry(0.28, 0.035, 12, 48);
  const ventMat = new THREE.MeshStandardMaterial({
    color: "#252530",
    metalness: 0.3,
    roughness: 0.35,
  });
  const vent = new THREE.Mesh(ventGeo, ventMat);
  vent.position.set(0, 1.12, 0);
  group.add(vent);

  // ── Side Vents ──
  [-0.45, 0.45].forEach((side) => {
    const svGeo = new THREE.CapsuleGeometry(0.06, 0.1, 4, 8);
    const svMat = new THREE.MeshStandardMaterial({
      color: "#1c1c22",
      metalness: 0.2,
      roughness: 0.45,
    });
    const sv = new THREE.Mesh(svGeo, svMat);
    sv.position.set(side, 0.15, 1.08);
    sv.rotation.set(0, side * 0.2, side * 0.15);
    group.add(sv);
  });

  // ── Decal Plane (hidden, receives uploaded texture) ──
  const decalGeo = new THREE.PlaneGeometry(0.55, 0.55);
  const decalMat = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    visible: false,
    roughness: 0.2,
    metalness: 0.0,
  });
  const decal = new THREE.Mesh(decalGeo, decalMat);
  decal.position.set(0, 0.3, 1.03);
  decal.name = "decal";
  group.add(decal);

  return group;
}

// ═══════════════════════════════════════════════════════════
// PHOTOREALISTIC PHONE CASE
// ═══════════════════════════════════════════════════════════

function createPhoneCase(envMap: THREE.Texture): THREE.Group {
  const group = new THREE.Group();

  // ── Body (rounded silicone) ──
  const bodyGeo = new THREE.BoxGeometry(0.9, 1.6, 0.1, 2, 2, 2);
  // Round the edges by modifying vertices
  const posAttr = bodyGeo.getAttribute("position");
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const factor = 0.02;
    const len = Math.sqrt(x * x + y * y);
    if (len > 0.8) {
      const scale = 1 - factor * (1 - 0.8 / len);
      posAttr.setXY(i, x * scale, y * scale);
    }
  }
  bodyGeo.computeVertexNormals();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: "#1c1c22",
    metalness: 0.02,
    roughness: 0.35,
    clearcoat: 0.2,
    clearcoatRoughness: 0.25,
    envMap: envMap,
    envMapIntensity: 0.5,
  });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  // ── Screen (glossy black glass) ──
  const screenGeo = new THREE.PlaneGeometry(0.76, 1.22);
  const screenMat = new THREE.MeshPhysicalMaterial({
    color: "#050508",
    metalness: 0.1,
    roughness: 0.03,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMap: envMap,
    envMapIntensity: 1.5,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.04, 0.055);
  group.add(screen);

  // ── Camera Module ──
  const camBaseGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.04, 32);
  const camBaseMat = new THREE.MeshStandardMaterial({
    color: "#2a2a30",
    metalness: 0.9,
    roughness: 0.1,
    envMap: envMap,
    envMapIntensity: 0.6,
  });
  const camBase = new THREE.Mesh(camBaseGeo, camBaseMat);
  camBase.position.set(0.25, 0.72, 0.08);
  group.add(camBase);

  const camLensGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.02, 32);
  const camLensMat = new THREE.MeshPhysicalMaterial({
    color: "#0a0a10",
    metalness: 0.0,
    roughness: 0.02,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
  });
  const camLens = new THREE.Mesh(camLensGeo, camLensMat);
  camLens.position.set(0.25, 0.72, 0.102);
  group.add(camLens);

  // ── Decal Plane ──
  const decalGeo = new THREE.PlaneGeometry(0.72, 0.95);
  const decalMat = new THREE.MeshStandardMaterial({
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    visible: false,
    roughness: 0.25,
  });
  const decal = new THREE.Mesh(decalGeo, decalMat);
  decal.position.set(0, 0.04, 0.06);
  decal.name = "decal";
  group.add(decal);

  return group;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function Simulador3D({
  textureUrl,
  modelType,
  onModelChange,
  className,
}: Simulador3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const envMapRef = useRef<THREE.Texture | null>(null);
  const animIdRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webglError, setWebglError] = useState(false);

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
        preserveDrawingBuffer: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050508");
    scene.fog = new THREE.Fog("#050508", 3, 12);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
    camera.position.set(0, 0.4, 4.2);
    cameraRef.current = camera;

    // Environment map for reflections
    const envMap = createEnvMap(renderer);
    scene.environment = envMap;
    envMapRef.current = envMap;

    // Studio lighting
    const ambient = new THREE.AmbientLight("#ffffff", 0.35);
    scene.add(ambient);

    const key = new THREE.DirectionalLight("#ffffff", 2.5);
    key.position.set(3, 2.5, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight("#ec4899", 1.2);
    fill.position.set(-2, 0.5, 1);
    scene.add(fill);

    const rim = new THREE.DirectionalLight("#8b5cf6", 1.8);
    rim.position.set(0, -0.5, -2);
    scene.add(rim);

    const top = new THREE.DirectionalLight("#ffffff", 1.5);
    top.position.set(0, 5, 1);
    scene.add(top);

    // Model
    const model = createHelmet(envMap);
    scene.add(model);
    modelRef.current = model;
    setLoading(false);

    // Mouse
    function onPointer(e: PointerEvent) {
      const r = container.getBoundingClientRect();
      pointerRef.current.x = (e.clientX - r.left) / r.width - 0.5;
      pointerRef.current.y = (e.clientY - r.top) / r.height - 0.5;
    }
    container.addEventListener("pointermove", onPointer, { passive: true });

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
    function animate() {
      animIdRef.current = requestAnimationFrame(animate);
      if (!modelRef.current) return;
      targetRef.current.x += (pointerRef.current.x * 0.45 - targetRef.current.x) * 0.035;
      targetRef.current.y += (-pointerRef.current.y * 0.25 - targetRef.current.y) * 0.035;
      modelRef.current.rotation.y = targetRef.current.x;
      modelRef.current.rotation.x = targetRef.current.y;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      container.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, [mounted]);

  // ── Swap model ─────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current || !modelRef.current || !envMapRef.current) return;
    const scene = sceneRef.current;
    scene.remove(modelRef.current);
    disposeGroup(modelRef.current);

    const model = modelType === "capacete"
      ? createHelmet(envMapRef.current)
      : createPhoneCase(envMapRef.current);
    scene.add(model);
    modelRef.current = model;

    if (textureUrl) applyTexture(model, textureUrl);
  }, [modelType]);

  // ── Texture ────────────────────────────────────────────
  useEffect(() => {
    if (!modelRef.current) return;
    textureUrl ? applyTexture(modelRef.current, textureUrl) : removeTexture(modelRef.current);
  }, [textureUrl]);

  // ── Render ─────────────────────────────────────────────
  if (!mounted) return <div className={cn("w-full h-full bg-[#050508]", className)} />;

  if (webglError) {
    return (
      <div className={cn("w-full h-full flex flex-col items-center justify-center bg-[#050508] gap-3", className)}>
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">⚠</div>
        <p className="text-zinc-500 text-xs">Navegador sem suporte WebGL</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full h-full min-h-[520px]", className)}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#050508]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-zinc-800 border-t-pink-500 animate-spin" />
            <p className="text-zinc-600 text-xs">Preparando visualizador...</p>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Decal indicator */}
      {textureUrl && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/70 backdrop-blur-xl border border-zinc-800 rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-300">Sua arte aplicada</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function applyTexture(group: THREE.Group, url: string) {
  const decal = group.getObjectByName("decal") as THREE.Mesh | undefined;
  if (!decal) return;
  new THREE.TextureLoader().load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = decal.material as THREE.MeshStandardMaterial;
    mat.map = tex;
    mat.visible = true;
    mat.needsUpdate = true;
  });
}

function removeTexture(group: THREE.Group) {
  const decal = group.getObjectByName("decal") as THREE.Mesh | undefined;
  if (!decal) return;
  const mat = decal.material as THREE.MeshStandardMaterial;
  if (mat.map) { mat.map.dispose(); mat.map = null; }
  mat.visible = false;
  mat.needsUpdate = true;
}

function disposeGroup(group: THREE.Group) {
  group.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.geometry?.dispose();
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => { m?.map?.dispose(); m?.dispose(); });
    }
  });
}
