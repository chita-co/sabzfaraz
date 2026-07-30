"use client";

import Silk from "@/components/Silk";

export default function SilkBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
      <Silk
        speed={5}
        scale={1}
        color="#7B7481"
        noiseIntensity={1.5}
        rotation={0}
      />
    </div>
  );
}