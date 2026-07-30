"use client";

import Antigravity from "@/components/Antigravity";

export default function AntigravityBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "#000" }}>
      <Antigravity
        count={200}
        magnetRadius={10}
        ringRadius={10}
        waveSpeed={0.4}
        waveAmplitude={1}
        particleSize={2}
        lerpSpeed={0.1}
        color="#3f6212" 
        autoAnimate={false}
        particleVariance={1}
        rotationSpeed={0}
        depthFactor={1}
        pulseSpeed={3}
        particleShape="capsule"
        fieldStrength={10}
      />
    </div>
  );
}