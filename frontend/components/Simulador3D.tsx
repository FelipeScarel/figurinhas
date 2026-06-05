"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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

// ── Build helmet mesh group ────────────────────────────────
function createHelmet(): THREE.Group {
  const group = new THREE.Group();

  // Shell
  const shellGeo = new THREE.SphereGeometry(1.15, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const shellMat = new THREE.MeshStandardMaterial({ color: "#18181b", metalness: 0.9, roughness: 0.1 });
  group.add(new THREE.Mesh(shellGeo, shellMat));

  // Stripe
  const stripeGeo = new THREE.TorusGeometry(0.95, 0.05, 16, 64, Math.PI);
  const stripeMat = new THREE.MeshStandardMaterial({ color: "#ec4899", metalness: 0.3, roughness: 0.15, emissive: "#ec4899", emissiveIntensity: 0.6 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, 0.35, 1.08);
  stripe.rotation.set(0.15, 0, 0);
  group.add(stripe);

  // Visor
  const visorGeo = new THREE.SphereGeometry(0.98, 40, 24, 0, Math.PI * 2, 0, 0.45);
  const visorMat = new THREE.MeshStandardMaterial({ color: "#09090b", metalness: 0.2, roughness: 0.05 });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.2, 0.95);
  visor.rotation.set(0.1, 0, 0);
  group.add(visor);

  // Visor rim
  const rimGeo = new THREE.TorusGeometry(0.88, 0.02, 16, 64, Math.PI * 0.85);
  const rimMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.7, roughness: 0.2 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.set(0, -0.05, 1.1);
  rim.rotation.set(0.2, 0, 0);
  group.add(rim);

  // Bottom rim
  const btmGeo = new THREE.TorusGeometry(0.98, 0.04, 16, 64);
  const btmMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.8, roughness: 0.2 });
  const btm = new THREE.Mesh(btmGeo, btmMat);
  btm.position.set(0, -0.7, 0);
  group.add(btm);

  // Chin guard
  const chinGeo = new THREE.SphereGeometry(0.75, 24, 16, 0, Math.PI * 2, 0.35, 0.35);
  const chinMat = new THREE.MeshStandardMaterial({ color: "#18181b", metalness: 0.85, roughness: 0.12 });
  const chin = new THREE.Mesh(chinGeo, chinMat);
  chin.position.set(0, -0.55, 0.75);
  chin.rotation.set(0.25, 0, 0);
  group.add(chin);

  // Top vent
  const ventGeo = new THREE.TorusGeometry(0.3, 0.03, 8, 32);
  const ventMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.9, roughness: 0.3 });
  const vent = new THREE.Mesh(ventGeo, ventMat);
  vent.position.set(0, 1.1, 0);
  group.add(vent);

  // Decal plane (hidden by default, shown when texture is applied)
  const decalGeo = new THREE.PlaneGeometry(0.55, 0.55);
  const decalMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.9, side: THREE.DoubleSide, visible: false });
  const decal = new THREE.Mesh(decalGeo, decalMat);
  decal.position.set(0, 0.3, 1.02);
  decal.name = "decal";
  group.add(decal);

  return group;
}

// ── Build phone case mesh group ────────────────────────────
function createPhoneCase(): THREE.Group {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.BoxGeometry(0.9, 1.6, 0.08);
  const bodyMat = new THREE.MeshStandardMaterial({ color: "#18181b", metalness: 0.6, roughness: 0.2 });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  // Screen
  const screenGeo = new THREE.PlaneGeometry(0.78, 1.2);
  const screenMat = new THREE.MeshStandardMaterial({ color: "#09090b", metalness: 0.1, roughness: 0.05 });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.05, 0.045);
  group.add(screen);

  // Camera
  const camGeo = new THREE.CircleGeometry(0.1, 16);
  const camMat = new THREE.MeshStandardMaterial({ color: "#27272a", metalness: 0.9, roughness: 0.1 });
  const cam = new THREE.Mesh(camGeo, camMat);
  cam.position.set(0.25, 0.72, 0.06);
  group.add(cam);

  // Decal plane
  const decalGeo = new THREE.PlaneGeometry(0.7, 0.9);
  const decalMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.85, side: THREE.DoubleSide, visible: false });
  const decal = new THREE.Mesh(decalGeo, decalMat);
  decal.position.set(0, 0.05, 0.05);
  decal.name = "decal";
  group.add(decal);

  return group;
}

// ── Exported Component ─────────────────────────────────────
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
  const animIdRef = useRef<number>(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [webglError, setWebglError] = useState(false);

  // Mount canvas once
  useEffect(() => {
    setMounted(true);
  }, []);

  // Init Three.js
  useEffect(() => {
    if (!mounted || !canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(rect.width, rect.height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog("#000000", 2.5, 10);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(42, rect.width / Math.max(rect.height, 1), 0.1, 20);
    camera.position.set(0, 0.5, 3.5);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight("#ffffff", 0.4));
    const d1 = new THREE.DirectionalLight("#ffffff", 1.8);
    d1.position.set(5, 5, 5);
    scene.add(d1);
    const d2 = new THREE.DirectionalLight("#ec4899", 2);
    d2.position.set(-3, 2, -3);
    scene.add(d2);
    const d3 = new THREE.DirectionalLight("#8b5cf6", 1.2);
    d3.position.set(0, -1, 5);
    scene.add(d3);
    const p = new THREE.PointLight("#ffffff", 1);
    p.position.set(0, 3, 0);
    scene.add(p);

    // Initial model
    const model = createHelmet();
    scene.add(model);
    modelRef.current = model;

    // Mouse tracking
    function onPointerMove(e: PointerEvent) {
      const r = container.getBoundingClientRect();
      pointerRef.current.x = (e.clientX - r.left) / r.width - 0.5;
      pointerRef.current.y = (e.clientY - r.top) / r.height - 0.5;
    }
    container.addEventListener("pointermove", onPointerMove);

    // Resize
    function onResize() {
      const r = container.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    // Animation loop
    function animate() {
      animIdRef.current = requestAnimationFrame(animate);
      if (!modelRef.current) return;

      // Smooth rotation follow
      targetRef.current.x += (pointerRef.current.x * 0.5 - targetRef.current.x) * 0.04;
      targetRef.current.y += (-pointerRef.current.y * 0.3 - targetRef.current.y) * 0.04;
      modelRef.current.rotation.y = targetRef.current.x;
      modelRef.current.rotation.x = targetRef.current.y;
      modelRef.current.position.y = Math.sin(performance.now() * 0.0005) * 0.06;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      container.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      scene.clear();
    };
  }, [mounted]);

  // Swap model when modelType changes
  useEffect(() => {
    if (!sceneRef.current || !modelRef.current) return;
    const scene = sceneRef.current;

    // Remove old
    scene.remove(modelRef.current);
    disposeGroup(modelRef.current);

    // Create new
    const model = modelType === "capacete" ? createHelmet() : createPhoneCase();
    scene.add(model);
    modelRef.current = model;

    // Re-apply texture if any
    if (textureUrl) {
      applyTexture(model, textureUrl);
    }
  }, [modelType]);

  // Apply texture when textureUrl changes
  useEffect(() => {
    if (!modelRef.current) return;
    if (!textureUrl) {
      removeTexture(modelRef.current);
      return;
    }
    applyTexture(modelRef.current, textureUrl);
  }, [textureUrl]);

  if (!mounted) {
    return (
      <div className={cn("w-full h-full min-h-[500px] flex items-center justify-center bg-black", className)}>
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-pink-500 animate-spin" />
      </div>
    );
  }

  if (webglError) {
    return (
      <div className={cn("w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-black gap-4", className)}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-2xl">
          &#9888;
        </div>
        <p className="text-zinc-500 text-sm">WebGL não disponível</p>
        <p className="text-zinc-600 text-xs">Tente outro navegador</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full h-full min-h-[500px]", className)}>
      {/* Model toggle tabs */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-full p-1">
        {(["capacete", "capinha"] as ModelType[]).map((m) => (
          <button
            key={m}
            onClick={() => onModelChange(m)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              modelType === m
                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20"
                : "text-zinc-400 hover:text-white"
            )}
          >
            {m === "capacete" ? "Capacete" : "Capinha"}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />

      {/* Texture indicator */}
      {textureUrl && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-full px-4 py-1.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-300">Textura aplicada</span>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────
function applyTexture(group: THREE.Group, url: string) {
  const decal = group.getObjectByName("decal") as THREE.Mesh | undefined;
  if (!decal) return;
  const loader = new THREE.TextureLoader();
  loader.load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    (decal.material as THREE.MeshStandardMaterial).map = tex;
    (decal.material as THREE.MeshStandardMaterial).visible = true;
    (decal.material as THREE.MeshStandardMaterial).needsUpdate = true;
  });
}

function removeTexture(group: THREE.Group) {
  const decal = group.getObjectByName("decal") as THREE.Mesh | undefined;
  if (!decal) return;
  const mat = decal.material as THREE.MeshStandardMaterial;
  mat.map = null;
  mat.visible = false;
  mat.needsUpdate = true;
}

function disposeGroup(group: THREE.Group) {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material?.dispose();
      }
    }
  });
}
