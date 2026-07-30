"use client";

import Ferrofluid from "@/components/Ferrofluid";

export default function FerrofluidBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "#000" }}>
      <Ferrofluid
        className=""
        dpr={1}
        mixBlendMode="normal"
        colors={["#16a34a", "#fde047", "#16a34a"]}
        speed={0.5}
        scale={1.6}
        turbulence={1}
        fluidity={0.1}
        rimWidth={0.2}
        sharpness={2.5}
        shimmer={1.5}
        glow={2}
        flowDirection="down"
        opacity={1}
        mouseInteraction
        mouseStrength={1}
        mouseRadius={0.35}
      />
    </div>
  );
}