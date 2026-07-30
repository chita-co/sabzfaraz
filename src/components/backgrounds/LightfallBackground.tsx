"use client";

import Lightfall from "@/components/Lightfall";

export default function LightfallBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
      <Lightfall
        className=""
        dpr={1}
        mixBlendMode="normal"
        colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
        backgroundColor="#0A29FF"
        speed={0.5}
        streakCount={2}
        streakWidth={1}
        streakLength={1}
        density={0.6}
        twinkle={1}
        glow={1}
        backgroundGlow={0.5}
        zoom={3}
        opacity={1}
        mouseInteraction
        mouseStrength={0.5}
        mouseRadius={1}
      />
    </div>
  );
}