"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function Spotlight({
  children,
  className,
  color = "rgba(236,72,153,0.15)",
}: SpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [opacity, setOpacity] = useState(0);

  function handleMouseMove(e: React.MouseEvent) {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={divRef}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onMouseMove={handleMouseMove}
      className={cn("relative overflow-hidden", className)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${color}, transparent 50%)`,
        }}
      />
      {children}
    </div>
  );
}

export function SpotlightBorder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative group", className)}>
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-pink-500/50 via-purple-500/30 to-pink-500/50 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
      <div className="relative rounded-2xl bg-black">{children}</div>
    </div>
  );
}
