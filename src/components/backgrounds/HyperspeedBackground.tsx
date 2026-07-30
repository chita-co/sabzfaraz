"use client";

import Hyperspeed from "@/components/Hyperspeed";
import { hyperspeedPresets } from "@/components/HyperSpeedPresets";

export default function HyperspeedBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "#000" }}>
      <Hyperspeed effectOptions={hyperspeedPresets.one} />
    </div>
  );
}