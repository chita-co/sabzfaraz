"use client";

import Galaxy from "@/components/Galaxy";

export default function GalaxyBackground() {
  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      zIndex: -1, 
      background: "#000000"   // ← پس‌زمینه مشکی 
    }}>
      <Galaxy
        starSpeed={0.5}
        density={0.3}           // تراکم دلخواه
        hueShift={50}           // رنگ طلایی (زرد-نارنجی)
        speed={1}
        glowIntensity={0.6}     // درخشش بیشتر
        saturation={1}          // اشباع کامل رنگ
        mouseRepulsion
        repulsionStrength={2}
        twinkleIntensity={0.3}
        rotationSpeed={0.1}
        transparent={false}     // ← transparent را false کن تا پس‌زمینه خودش شفاف نماند
      />
    </div>
  );
}