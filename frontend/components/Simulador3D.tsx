"use client";

import { useRef, useMemo, useState, useEffect, Suspense, useCallback } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────
type ModelType = "capacete" | "capinha";

interface Simulador3DProps {
  textureUrl: string | null;
  modelType: ModelType;
  onModelChange: (m: ModelType) => void;
  className?: string;
}

// ── Helmet Model ───────────────────────────────────────────
function CapaceteModel({ textureUrl }: { textureUrl: string | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const [decalTexture, setDecalTexture] = useState<THREE.Texture | null>(null);

  // Load uploaded texture
  useEffect(() => {
    if (!textureUrl) {
      setDecalTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setDecalTexture(tex);
      },
      undefined,
      () => setDecalTexture(null)
    );
  }, [textureUrl]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y +=
      (state.pointer.x * 0.5 - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x +=
      (-state.pointer.y * 0.3 - groupRef.current.rotation.x) * 0.04;
    groupRef.current.position.y =
      Math.sin(state.clock.getElapsedTime() * 0.5) * 0.06;
  });

  return (
    <group ref={groupRef}>
      {/* Shell */}
      <mesh>
        <sphereGeometry args={[1.15, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial color="#18181b" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Stripe */}
      <mesh position={[0, 0.35, 1.08]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.95, 0.05, 16, 64, Math.PI]} />
        <meshStandardMaterial
          color="#ec4899"
          metalness={0.3}
          roughness={0.15}
          emissive="#ec4899"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Visor */}
      <mesh position={[0, 0.2, 0.95]} rotation={[0.1, 0, 0]}>
        <sphereGeometry args={[0.98, 40, 24, 0, Math.PI * 2, 0, 0.45]} />
        <meshStandardMaterial color="#09090b" metalness={0.2} roughness={0.05} />
      </mesh>

      {/* Visor rim */}
      <mesh position={[0, -0.05, 1.1]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.88, 0.02, 16, 64, Math.PI * 0.85]} />
        <meshStandardMaterial color="#27272a" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Bottom rim */}
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.98, 0.04, 16, 64]} />
        <meshStandardMaterial color="#27272a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Chin guard */}
      <mesh position={[0, -0.55, 0.75]} rotation={[0.25, 0, 0]}>
        <sphereGeometry args={[0.75, 24, 16, 0, Math.PI * 2, 0.35, 0.35]} />
        <meshStandardMaterial color="#18181b" metalness={0.85} roughness={0.12} />
      </mesh>

      {/* Top vent */}
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[0.3, 0.03, 8, 32]} />
        <meshStandardMaterial color="#27272a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Decal / texture plane on front of helmet */}
      {decalTexture && (
        <mesh position={[0, 0.3, 1.02]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.55, 0.55]} />
          <meshStandardMaterial
            map={decalTexture}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ── Phone Case Model ───────────────────────────────────────
function CapinhaModel({ textureUrl }: { textureUrl: string | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const [decalTexture, setDecalTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!textureUrl) {
      setDecalTexture(null);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setDecalTexture(tex);
      },
      undefined,
      () => setDecalTexture(null)
    );
  }, [textureUrl]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y +=
      (state.pointer.x * 0.5 - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x +=
      (-state.pointer.y * 0.3 - groupRef.current.rotation.x) * 0.04;
  });

  return (
    <group ref={groupRef}>
      {/* Phone body */}
      <mesh>
        <boxGeometry args={[0.9, 1.6, 0.08]} />
        <meshStandardMaterial color="#18181b" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Phone screen area */}
      <mesh position={[0, 0.05, 0.045]}>
        <planeGeometry args={[0.78, 1.2]} />
        <meshStandardMaterial color="#09090b" metalness={0.1} roughness={0.05} />
      </mesh>

      {/* Camera bump */}
      <mesh position={[0.25, 0.72, 0.06]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#27272a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Decal / sticker on phone back */}
      {decalTexture && (
        <mesh position={[0, 0.05, 0.05]}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshStandardMaterial
            map={decalTexture}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ── Scene ──────────────────────────────────────────────────
function Scene({
  textureUrl,
  modelType,
}: {
  textureUrl: string | null;
  modelType: ModelType;
}) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 2.5, 10]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-3, 2, -3]} intensity={2} color="#ec4899" />
      <directionalLight position={[0, -1, 5]} intensity={1.2} color="#8b5cf6" />
      <pointLight position={[0, 3, 0]} intensity={1} color="#ffffff" />
      {modelType === "capacete" ? (
        <CapaceteModel textureUrl={textureUrl} />
      ) : (
        <CapinhaModel textureUrl={textureUrl} />
      )}
    </>
  );
}

// ── Loader ─────────────────────────────────────────────────
function Loader3D() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border border-pink-500/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border-t-2 border-pink-500 animate-spin" />
        </div>
        <p className="text-xs text-zinc-600">Carregando visualizador 3D</p>
      </div>
    </div>
  );
}

// ── Exported Component ─────────────────────────────────────
export default function Simulador3D({
  textureUrl,
  modelType,
  onModelChange,
  className,
}: Simulador3DProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={cn("relative w-full h-full min-h-[500px]", className)}>
      {/* Model toggle tabs */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1 glass rounded-full p-1">
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
            {m === "capacete" ? "🎨 Capacete" : "📱 Capinha"}
          </button>
        ))}
      </div>

      {/* Canvas */}
      {mounted && (
        <Suspense fallback={<Loader3D />}>
          <Canvas
            camera={{ position: [0, 0.5, 3.5], fov: 42, near: 0.1, far: 20 }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              failIfMajorPerformanceCaveat: false,
            }}
            style={{ background: "transparent" }}
          >
            <Scene textureUrl={textureUrl} modelType={modelType} />
          </Canvas>
        </Suspense>
      )}

      {/* Texture indicator */}
      {textureUrl && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 glass rounded-full px-4 py-1.5 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center">
            <span className="text-[10px]">✓</span>
          </div>
          <span className="text-xs text-zinc-300">Textura aplicada</span>
        </div>
      )}
    </div>
  );
}
