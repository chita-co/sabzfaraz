"use client";

import Aurora from "@/components/Aurora";

export default function AuroraBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
      <Aurora
        colorStops={["#5227FF", "#7cff67", "#5227FF"]}
        amplitude={1}
        blend={0.5}
      />
    </div>
  );
}