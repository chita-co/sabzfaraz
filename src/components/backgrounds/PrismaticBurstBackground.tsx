"use client";

import PrismaticBurst from "@/components/PrismaticBurst";

export default function PrismaticBurstBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
      <PrismaticBurst
        intensity={1}
        speed={0.1}
        animationType="rotate3d"
        colors={["#5227FF", "#FFD700", "#7cff67"]}
        distort={0}
        hoverDampness={0}
        rayCount={0}
      />
    </div>
  );
}