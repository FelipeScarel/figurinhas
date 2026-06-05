"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

// ── Props ──────────────────────────────────────────────────
interface Props {
  textureUrl: string | null;
  helmetColor: "white" | "black";
  decalScale: number; // 0.3 to 2.0
  className?: string;
}

// ═══════════════════════════════════════════════════════════
// STUDIO ENVIRONMENT MAP
// ═══════════════════════════════════════════════════════════
function createStudioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();

  // Neutral grey gradient sphere
  const hemi = new THREE.Mesh(
    new THREE.SphereGeometry(8, 32, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: `varying vec3 w;void main(){vec4 p=modelMatrix*vec4(position,1.);w=p.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 w;void main(){float h=normalize(w).y;float t=smoothstep(-0.2,0.7,h);gl_FragColor=vec4(mix(vec3(.03),vec3(.18),t),1.);}`,
    })
  );
  scene.add(hemi);

  // Light panels
  const pg = new THREE.PlaneGeometry(3, 2);
  const pm = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });
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
    scene.add(p);
  });

  const env = new THREE.PMREMGenerator(renderer).fromScene(scene, 0.02).texture;
  pg.dispose();
  pm.dispose();
  scene.clear();
  return env;
}

// ═══════════════════════════════════════════════════════════
// HELMET BUILDER
// ═══════════════════════════════════════════════════════════
function buildHelmet(
  color: "white" | "black",
  envMap: THREE.Texture
): { group: THREE.Group; decal: THREE.Mesh } {
  const group = new THREE.Group();

  const isWhite = color === "white";
  const shellColor = isWhite ? "#f5f5f7" : "#1a1a1e";
  const shellRoughness = isWhite ? 0.22 : 0.14;
  const trimColor = isWhite ? "#e0e0e4" : "#222228";

  // ── Shell ──
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 100, 72, 0, Math.PI * 2, 0, Math.PI * 0.66),
    new THREE.MeshPhysicalMaterial({
      color: shellColor,
      metalness: 0.05,
      roughness: shellRoughness,
      clearcoat: 0.6,
      clearcoatRoughness: 0.06,
      envMap,
      envMapIntensity: 1.0,
    })
  );
  group.add(shell);

  // ── Stripe ──
  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.96, 0.05, 24, 100, Math.PI),
    new THREE.MeshPhysicalMaterial({
      color: "#ec4899",
      metalness: 0.3,
      roughness: 0.1,
      emissive: "#ec4899",
      emissiveIntensity: 0.2,
      clearcoat: 0.4,
      clearcoatRoughness: 0.04,
      envMap,
      envMapIntensity: 0.7,
    })
  );
  stripe.position.set(0, 0.35, 1.08);
  stripe.rotation.set(0.15, 0, 0);
  group.add(stripe);

  // ── Visor ──
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 64, 40, 0, Math.PI * 2, 0, 0.48),
    new THREE.MeshPhysicalMaterial({
      color: "#08080e",
      metalness: 0.02,
      roughness: 0.03,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      envMap,
      envMapIntensity: 1.3,
    })
  );
  visor.position.set(0, 0.2, 0.95);
  visor.rotation.set(0.1, 0, 0);
  group.add(visor);

  // ── Visor frame ──
  const frame = new THREE.Mesh(
    new THREE.TorusGeometry(0.89, 0.022, 12, 80, Math.PI * 0.82),
    new THREE.MeshStandardMaterial({ color: trimColor, metalness: 0.02, roughness: 0.5 })
  );
  frame.position.set(0, -0.05, 1.1);
  frame.rotation.set(0.2, 0, 0);
  group.add(frame);

  // ── Bottom rim ──
  const brim = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.05, 16, 80),
    new THREE.MeshStandardMaterial({ color: trimColor, metalness: 0.02, roughness: 0.5 })
  );
  brim.position.set(0, -0.72, 0);
  group.add(brim);

  // ── Chin bar ──
  const chin = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 48, 32, 0, Math.PI * 2, 0.38, 0.32),
    new THREE.MeshPhysicalMaterial({
      color: shellColor,
      metalness: 0.05,
      roughness: shellRoughness + 0.04,
      clearcoat: 0.3,
      clearcoatRoughness: 0.08,
      envMap,
      envMapIntensity: 0.7,
    })
  );
  chin.position.set(0, -0.55, 0.78);
  chin.rotation.set(0.28, 0, 0);
  group.add(chin);

  // ── Top vent ──
  const vent = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.032, 12, 48),
    new THREE.MeshStandardMaterial({ color: trimColor, metalness: 0.2, roughness: 0.4 })
  );
  vent.position.set(0, 1.12, 0);
  group.add(vent);

  // ── Side details ──
  [-0.44, 0.44].forEach((side) => {
    const sd = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.1, 4, 8),
      new THREE.MeshStandardMaterial({ color: trimColor, metalness: 0.1, roughness: 0.45 })
    );
    sd.position.set(side, 0.15, 1.08);
    sd.rotation.set(0, side * 0.2, side * 0.12);
    group.add(sd);
  });

  // ── Decal plane ──
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      visible: false,
      roughness: 0.15,
      metalness: 0,
      depthWrite: true,
    })
  );
  decal.position.set(0, 0.3, 1.03);
  decal.name = "decal";
  group.add(decal);

  return { group, decal };
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
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
  const groupRef = useRef<THREE.Group | null>(null);
  const decalRef = useRef<THREE.Mesh | null>(null);
  const envRef = useRef<THREE.Texture | null>(null);
  const animRef = useRef(0);
  const ptrRef = useRef({ x: 0, y: 0 });
  const tgtRef = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => setMounted(true), []);

  // Init
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
      setError(true);
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
    camera.position.set(0, 0.35, 4.2);
    cameraRef.current = camera;

    // Env map
    const envMap = createStudioEnv(renderer);
    scene.environment = envMap;
    envRef.current = envMap;

    // Lights
    scene.add(new THREE.AmbientLight("#ffffff", 0.35));
    const key = new THREE.DirectionalLight("#ffffff", 2.8);
    key.position.set(3.5, 2.5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight("#ec4899", 1.0);
    fill.position.set(-2, 0.5, 1.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight("#8b5cf6", 1.5);
    rim.position.set(-0.5, -0.3, -2.5);
    scene.add(rim);
    const top = new THREE.DirectionalLight("#ffffff", 1.8);
    top.position.set(0, 5, 1);
    scene.add(top);

    // Helmet
    const { group, decal } = buildHelmet(helmetColor, envMap);
    scene.add(group);
    groupRef.current = group;
    decalRef.current = decal;
    setLoading(false);

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
      if (!groupRef.current) return;
      tgtRef.current.x += (ptrRef.current.x * 0.4 - tgtRef.current.x) * 0.03;
      tgtRef.current.y += (-ptrRef.current.y * 0.22 - tgtRef.current.y) * 0.03;
      groupRef.current.rotation.y = tgtRef.current.x;
      groupRef.current.rotation.x = tgtRef.current.y;
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
    if (!sceneRef.current || !groupRef.current || !envRef.current) return;
    const scene = sceneRef.current;
    disposeGroup(groupRef.current);
    scene.remove(groupRef.current);

    const { group, decal } = buildHelmet(helmetColor, envRef.current);
    scene.add(group);
    groupRef.current = group;
    decalRef.current = decal;

    if (textureUrl) applyTexture(decal, textureUrl, decalScale);
  }, [helmetColor]);

  // ── Texture ─────────────────────────────────────────────
  useEffect(() => {
    if (!decalRef.current) return;
    if (!textureUrl) {
      removeTexture(decalRef.current);
      return;
    }
    applyTexture(decalRef.current, textureUrl, decalScale);
  }, [textureUrl, decalScale]);

  if (!mounted)
    return <div className={className} style={{ background: "#0a0a0c" }} />;

  if (error)
    return (
      <div
        className={className}
        style={{
          background: "#0a0a0c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#52525b",
          fontSize: "0.8rem",
        }}
      >
        WebGL indisponível — use outro navegador
      </div>
    );

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", minHeight: 480 }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0c",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "2px solid #27272a",
              borderTopColor: "#ec4899",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function applyTexture(decal: THREE.Mesh, url: string, scale: number) {
  new THREE.TextureLoader().load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = decal.material as THREE.MeshStandardMaterial;
    if (mat.map) mat.map.dispose();
    mat.map = tex;
    mat.visible = true;
    mat.needsUpdate = true;
    // Scale the decal plane
    const s = Math.max(0.3, Math.min(2.0, scale));
    decal.scale.set(s, s, 1);
  });
}

function removeTexture(decal: THREE.Mesh) {
  const mat = decal.material as THREE.MeshStandardMaterial;
  if (mat.map) {
    mat.map.dispose();
    mat.map = null;
  }
  mat.visible = false;
  mat.needsUpdate = true;
}

function disposeGroup(g: THREE.Group) {
  g.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.geometry?.dispose();
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    }
  });
}
