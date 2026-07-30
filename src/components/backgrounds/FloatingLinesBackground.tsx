// src/components/backgrounds/FloatingLinesBackground.tsx
"use client";

import FloatingLines from "@/components/FloatingLines";

export default function FloatingLinesBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <FloatingLines
        linesGradient={["#E945F5", "#2F4BC0", "#E945F5"]}
        animationSpeed={1}
        interactive
        bendRadius={5}
        bendStrength={-0.5}
        mouseDamping={0.05}
        parallax
        parallaxStrength={0.2}
        topWavePosition={{ x: 0, y: 0.2 }}
        middleWavePosition={{ x: 0, y: 0.5 }}
      />
    </div>
  );
}