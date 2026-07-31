"use client";

import Particles from "@/components/Particles";

export default function ParticlesBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "#000000" }}>
      <Particles
        className=""
        particleCount={200}
        particleSpread={10}
        speed={0.1}
        particleColors={["#4ade80", "#eab308", "#ffffff"]}
        moveParticlesOnHover={false}
        particleHoverFactor={1}
        alphaParticles={false}
        particleBaseSize={100}
        sizeRandomness={1}
        cameraDistance={20}
        disableRotation={false}
      />
    </div>
  );
}