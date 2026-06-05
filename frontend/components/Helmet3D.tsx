"use client";

import { useRef, useMemo, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Helmet Geometry Group ──────────────────────────────────
function HelmetGeometry() {
  const groupRef = useRef<THREE.Group>(null);

  // Pre-compute data once
  const data = useMemo(() => {
    const stickers = Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      return {
        x: Math.cos(angle) * 1.5,
        z: Math.sin(angle) * 1.5,
        y: -0.2 + i * 0.15,
        color: ["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"][i],
      };
    });

    const dots = Array.from({ length: 15 }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.8;
      const r = 1.4 + Math.random() * 0.6;
      return {
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ),
        speed: 1 + Math.random() * 2,
      };
    });

    return { stickers, dots };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y +=
      (state.pointer.x * 0.5 - groupRef.current.rotation.y) * 0.04;
    groupRef.current.rotation.x +=
      (-state.pointer.y * 0.3 - groupRef.current.rotation.x) * 0.04;
    groupRef.current.position.y =
      Math.sin(state.clock.getElapsedTime() * 0.5) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {/* Main helmet shell */}
      <mesh>
        <sphereGeometry args={[1.15, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.85}
          roughness={0.12}
        />
      </mesh>

      {/* Helmet stripe */}
      <mesh position={[0, 0.35, 1.08]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.95, 0.06, 16, 64, Math.PI]} />
        <meshStandardMaterial
          color="#ec4899"
          metalness={0.3}
          roughness={0.15}
          emissive="#ec4899"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Visor */}
      <mesh position={[0, 0.2, 0.95]} rotation={[0.1, 0, 0]}>
        <sphereGeometry args={[0.98, 40, 24, 0, Math.PI * 2, 0, 0.45]} />
        <meshStandardMaterial color="#111122" metalness={0.15} roughness={0.08} />
      </mesh>

      {/* Visor rim */}
      <mesh position={[0, -0.05, 1.1]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.88, 0.025, 16, 64, Math.PI * 0.85]} />
        <meshStandardMaterial color="#222233" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Bottom rim */}
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.98, 0.04, 16, 64]} />
        <meshStandardMaterial color="#2a2a3a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Chin guard */}
      <mesh position={[0, -0.55, 0.75]} rotation={[0.25, 0, 0]}>
        <sphereGeometry args={[0.75, 24, 16, 0, Math.PI * 2, 0.35, 0.35]} />
        <meshStandardMaterial color="#1e1e32" metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Top vent */}
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[0.3, 0.03, 8, 32]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Side accents */}
      {[0.4, -0.4].map((side, i) => (
        <mesh
          key={i}
          position={[side, 0.3, 1.02]}
          rotation={[0, side * 0.15, side * 0.15]}
        >
          <boxGeometry args={[0.12, 0.08, 0.02]} />
          <meshStandardMaterial
            color={i === 0 ? "#ec4899" : "#8b5cf6"}
            metalness={0.4}
            roughness={0.2}
            emissive={i === 0 ? "#ec4899" : "#8b5cf6"}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* Floating sticker cubes */}
      {data.stickers.map((s, i) => (
        <FloatingSticker key={`s-${i}`} data={s} index={i} />
      ))}

      {/* Sparkle dots */}
      {data.dots.map((d, i) => (
        <FloatingDot key={`dot-${i}`} data={d} />
      ))}
    </group>
  );
}

// ── Simple floating sticker (no drei dependency) ────────────
function FloatingSticker({
  data,
  index,
}: {
  data: { x: number; y: number; z: number; color: string };
  index: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const speed = 1.5 + index * 0.3;
    ref.current.position.y = data.y + Math.sin(t * speed) * 0.2;
    ref.current.rotation.z += 0.01;
    ref.current.rotation.x += 0.005;
    ref.current.position.x = data.x + Math.cos(t * speed * 0.7) * 0.1;
  });

  return (
    <mesh ref={ref} position={[data.x, data.y, data.z]}>
      <boxGeometry args={[0.16, 0.16, 0.02]} />
      <meshStandardMaterial
        color={data.color}
        metalness={0.2}
        roughness={0.3}
        emissive={data.color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

// ── Simple floating dot ────────────────────────────────────
function FloatingDot({ data }: { data: { pos: THREE.Vector3; speed: number } }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.position.y = data.pos.y + Math.sin(t * data.speed) * 0.15;
    ref.current.position.x = data.pos.x + Math.cos(t * data.speed * 0.6) * 0.08;
  });

  return (
    <mesh ref={ref} position={data.pos}>
      <sphereGeometry args={[0.015, 4, 4]} />
      <meshBasicMaterial color="#ec4899" />
    </mesh>
  );
}

// ── Scene ──────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 3, 12]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-3, 2, -3]} intensity={1.8} color="#ec4899" />
      <directionalLight position={[0, -1, 5]} intensity={1.2} color="#8b5cf6" />
      <HelmetGeometry />
    </>
  );
}

// ── Loader ─────────────────────────────────────────────────
function Loader() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#020617] gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-t-2 border-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  );
}

// ── Exported Component ─────────────────────────────────────
export default function Helmet3D({ className }: { className?: string }) {
  // Only render on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#020617]">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className || ""}`}>
      <Suspense fallback={<Loader />}>
        <Canvas
          camera={{ position: [0, 0.5, 3.5], fov: 42, near: 0.1, far: 20 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
          }}
          style={{ background: "transparent" }}
          onCreated={() => {
            // Canvas ready
          }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
