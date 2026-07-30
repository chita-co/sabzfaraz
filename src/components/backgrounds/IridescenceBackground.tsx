"use client";

import Iridescence from "@/components/Iridescence";

export default function IridescenceBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
      <Iridescence
        speed={1}
        amplitude={0.1}
        mouseReact
      />
    </div>
  );
}