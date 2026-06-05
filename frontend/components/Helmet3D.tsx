"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  MeshTransmissionMaterial,
  useTexture,
  RoundedBox,
  Sphere,
  Torus,
} from "@react-three/drei";
import * as THREE from "three";

// ── Helmet Model ───────────────────────────────────────────
function HelmetGeometry() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y +=
      (state.pointer.x * 0.5 - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x +=
      (-state.pointer.y * 0.3 - groupRef.current.rotation.x) * 0.05;
    // subtle float
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.08;
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* Main helmet shell */}
      <mesh castShadow>
        <sphereGeometry args={[1.15, 64, 48, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          metalness={0.85}
          roughness={0.12}
          clearcoat={0.6}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Helmet stripe */}
      <mesh position={[0, 0.35, 1.08]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.95, 0.06, 16, 80, Math.PI]} />
        <meshPhysicalMaterial
          color="#ec4899"
          metalness={0.3}
          roughness={0.15}
          emissive="#ec4899"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Visor */}
      <mesh position={[0, 0.2, 0.95]} rotation={[0.1, 0, 0]}>
        <sphereGeometry args={[0.98, 48, 32, 0, Math.PI * 2, 0, 0.45]} />
        <meshPhysicalMaterial
          color="#111122"
          metalness={0.2}
          roughness={0.05}
          transmission={0.4}
          thickness={0.1}
          ior={1.5}
          envMapIntensity={1}
        />
      </mesh>

      {/* Visor rim */}
      <mesh position={[0, -0.05, 1.1]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.88, 0.025, 16, 80, Math.PI * 0.85]} />
        <meshStandardMaterial
          color="#222233"
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Bottom rim */}
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.98, 0.04, 16, 80]} />
        <meshStandardMaterial
          color="#2a2a3a"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Chin guard */}
      <mesh position={[0, -0.55, 0.75]} rotation={[0.25, 0, 0]}>
        <sphereGeometry args={[0.75, 32, 24, 0, Math.PI * 2, 0.35, 0.35]} />
        <meshPhysicalMaterial
          color="#1e1e32"
          metalness={0.8}
          roughness={0.15}
          clearcoat={0.4}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Top ventilation */}
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[0.3, 0.03, 8, 32]} />
        <meshStandardMaterial
          color="#2a2a3e"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>

      {/* Side details */}
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

      {/* Floating stickers around helmet */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 1.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const colors = ["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];
        return (
          <Float
            key={i}
            speed={1.5 + i * 0.3}
            rotationIntensity={1}
            floatIntensity={0.6}
          >
            <RoundedBox
              args={[0.18, 0.18, 0.02]}
              radius={0.03}
              position={[x, -0.2 + i * 0.15, z]}
            >
              <meshStandardMaterial
                color={colors[i]}
                metalness={0.2}
                roughness={0.3}
                emissive={colors[i]}
                emissiveIntensity={0.5}
              />
            </RoundedBox>
          </Float>
        );
      })}

      {/* Particle sparkles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.8;
        const r = 1.4 + Math.random() * 0.6;
        const px = r * Math.sin(phi) * Math.cos(theta);
        const py = r * Math.cos(phi);
        const pz = r * Math.sin(phi) * Math.sin(theta);
        return (
          <Float key={`dot-${i}`} speed={2 + Math.random() * 3} floatIntensity={0.3}>
            <mesh position={[px, py, pz]}>
              <sphereGeometry args={[0.015, 4, 4]} />
              <meshBasicMaterial color="#ec4899" />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

// ── Scene Setup ────────────────────────────────────────────
function Scene() {
  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 3, 12]} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.4}
        penumbra={1}
        intensity={1.5}
        color="#ffffff"
        castShadow
      />
      <spotLight
        position={[-5, 2, -3]}
        angle={0.5}
        penumbra={1}
        intensity={2}
        color="#ec4899"
      />
      <spotLight
        position={[0, -2, 5]}
        angle={0.6}
        penumbra={1}
        intensity={1}
        color="#8b5cf6"
      />
      <pointLight position={[0, 3, 0]} intensity={0.8} color="#ffffff" />

      <HelmetGeometry />
      <Environment preset="city" />
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
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
