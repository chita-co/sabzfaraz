"use client";

import Iridescence from "@/components/Iridescence";

export default function IridescenceBackground() {
    return null; // TEMP: بک‌گراند سراسری bg-site.png
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