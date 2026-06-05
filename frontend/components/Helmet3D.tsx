"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// ── Pre-computed particle positions (stable across renders) ─
const PARTICLE_COUNT = 20;
const STICKER_COUNT = 6;

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.8;
    const r = 1.4 + Math.random() * 0.6;
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta),
      speed: 2 + Math.random() * 3,
    };
  });
}

function generateStickers() {
  const colors = ["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];
  return Array.from({ length: STICKER_COUNT }, (_, i) => {
    const angle = (i / STICKER_COUNT) * Math.PI * 2;
    const radius = 1.5;
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      y: -0.2 + i * 0.15,
      speed: 1.5 + i * 0.3,
      color: colors[i],
    };
  });
}

// ── Helmet Model ───────────────────────────────────────────
function HelmetGeometry() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(generateParticles, []);
  const stickers = useMemo(generateStickers, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y +=
      (state.pointer.x * 0.5 - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x +=
      (-state.pointer.y * 0.3 - groupRef.current.rotation.x) * 0.05;
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.08;
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* Main helmet shell */}
      <mesh>
        <sphereGeometry args={[1.15, 48, 36, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          metalness={0.85}
          roughness={0.12}
          clearcoat={0.6}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Helmet stripe - pink */}
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
        <meshStandardMaterial
          color="#111122"
          metalness={0.15}
          roughness={0.08}
        />
      </mesh>

      {/* Visor rim */}
      <mesh position={[0, -0.05, 1.1]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.88, 0.025, 16, 64, Math.PI * 0.85]} />
        <meshStandardMaterial
          color="#222233"
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Bottom rim */}
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.98, 0.04, 16, 64]} />
        <meshStandardMaterial
          color="#2a2a3a"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Chin guard */}
      <mesh position={[0, -0.55, 0.75]} rotation={[0.25, 0, 0]}>
        <sphereGeometry args={[0.75, 24, 16, 0, Math.PI * 2, 0.35, 0.35]} />
        <meshStandardMaterial
          color="#1e1e32"
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>

      {/* Top vent */}
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[0.3, 0.03, 8, 32]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Side accents */}
      {[0.4, -0.4].map((side, i) => (
        <group key={i} position={[side, 0.3, 1.02]} rotation={[0, side * 0.15, side * 0.15]}>
          <mesh>
            <boxGeometry args={[0.12, 0.08, 0.02]} />
            <meshStandardMaterial
              color={i === 0 ? "#ec4899" : "#8b5cf6"}
              metalness={0.4}
              roughness={0.2}
              emissive={i === 0 ? "#ec4899" : "#8b5cf6"}
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      ))}

      {/* Floating stickers */}
      {stickers.map((s, i) => (
        <Float key={`sticker-${i}`} speed={s.speed} rotationIntensity={1} floatIntensity={0.6}>
          <RoundedBox args={[0.18, 0.18, 0.02]} radius={0.03} position={[s.x, s.y, s.z]}>
            <meshStandardMaterial
              color={s.color}
              metalness={0.2}
              roughness={0.3}
              emissive={s.color}
              emissiveIntensity={0.5}
            />
          </RoundedBox>
        </Float>
      ))}

      {/* Sparkle particles */}
      {particles.map((p, i) => (
        <Float key={`dot-${i}`} speed={p.speed} floatIntensity={0.3}>
          <mesh position={[p.x, p.y, p.z]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshBasicMaterial color="#ec4899" />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// ── Fallback (shown if WebGL fails) ─────────────────────────
function WebGLFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#020617] gap-4 p-8">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border-2 border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-primary/30">
          FS
        </div>
      </div>
      <p className="text-white font-semibold text-lg">Figurinhas<span className="text-primary">.</span></p>
      <p className="text-muted-foreground text-sm">Adesivos Premium para Capacete e Moto</p>
    </div>
  );
}

// ── Scene ──────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 3, 12]} />
      <ambientLight intensity={0.5} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.4}
        penumbra={1}
        intensity={2}
        color="#ffffff"
      />
      <spotLight
        position={[-5, 2, -3]}
        angle={0.5}
        penumbra={1}
        intensity={2.5}
        color="#ec4899"
      />
      <spotLight
        position={[0, -2, 5]}
        angle={0.6}
        penumbra={1}
        intensity={1.5}
        color="#8b5cf6"
      />
      <pointLight position={[0, 3, 0]} intensity={1} color="#ffffff" />
      <HelmetGeometry />
    </>
  );
}

// ── Loader ─────────────────────────────────────────────────
function Loader() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#020617] gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-t-2 border-primary animate-spin" />
        <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/30" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        Carregando capacete 3D...
      </p>
    </div>
  );
}

// ── Exported Component ─────────────────────────────────────
export default function Helmet3D({ className }: { className?: string }) {
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
          }}
          style={{ background: "transparent" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
