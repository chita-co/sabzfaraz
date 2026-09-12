"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function PartnerBioAccordion({
  bio,
  variant = "default",
}: {
  bio: string;
  variant?: "default" | "neon";
}) {
  const [open, setOpen] = useState(false);
  const prefix = variant === "neon" ? "partner-bio-neon" : "partner-bio";

  return (
    <div className={`${prefix}-accordion`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`${prefix}-toggle`}>
        <span>توضیحات فروشگاه</span>
        <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
      </button>
      <div className={`${prefix}-body ${open ? "open" : ""}`}>
        <p>{bio}</p>
      </div>
    </div>
  );
}