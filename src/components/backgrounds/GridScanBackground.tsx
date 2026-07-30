"use client";

import { GridScan } from "@/components/GridScan";

export default function GridScanBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "#000" }}>
      <GridScan
        className=""
        style={{}}
        sensitivity={0.55}
        lineThickness={1}
        linesColor="#2F293A"
        scanColor="#4a9eff" 
        scanOpacity={0.5}
        gridScale={0.1}
        lineStyle="solid"
        lineJitter={0.1}
        scanDirection="pingpong"
        noiseIntensity={0.01}
        scanGlow={0.4}
        scanSoftness={2}
        scanDuration={2}
        scanDelay={2}
        scanOnClick={false}
      />
    </div>
  );
}