"use client";

import { useState } from "react";
import { X } from "lucide-react";

const BADGES = [
  { slug: "badge-1", alt: "نشان اول" },
  { slug: "badge-2", alt: "نشان دوم" },
];

export default function TrustBadges() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="trust-badges-row">
        {BADGES.map((b) => (
          <button
            key={b.slug}
            type="button"
            className="trust-badge-btn"
            onClick={() => setOpen(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/certificates/${b.slug}.png`} alt={b.alt} />
          </button>
        ))}
      </div>

      {open && (
        <div className="trust-badge-modal-overlay" onClick={() => setOpen(false)}>
          <div className="trust-badge-modal" onClick={(e) => e.stopPropagation()}>
            <button className="trust-badge-modal-close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/certificates/badge-detail.png" alt="جزئیات نشان" />
          </div>
        </div>
      )}
    </>
  );
}