"use client";

import { useState } from "react";
import { X, Info } from "lucide-react";

export default function DescriptionModal({
  title,
  description,
}: {
  title: string;
  description: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  if (!description) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="description-trigger-btn">
        <Info size={13} /> توضیحات
      </button>

      {open && (
        <div className="description-modal-overlay" onClick={() => setOpen(false)}>
          <div className="description-modal" onClick={(e) => e.stopPropagation()}>
            <button className="description-modal-close" onClick={() => setOpen(false)} aria-label="بستن">
              <X size={18} />
            </button>
            <h2 className="description-modal-title">{title}</h2>
            <div className="description-modal-body">
              <p style={{ whiteSpace: "pre-line" }}>{description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}