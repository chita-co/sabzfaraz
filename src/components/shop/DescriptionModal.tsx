"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Info } from "lucide-react";

export default function DescriptionModal({
  title,
  description,
}: {
  title: string;
  description: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!description) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="description-trigger-btn">
        <Info size={13} /> توضیحات
      </button>

      {open &&
        createPortal(
          <div
            className="description-modal-overlay"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="description-modal" onClick={(e) => e.stopPropagation()}>
              <div className="description-modal-head">
                <h2 className="description-modal-title">{title}</h2>
                <button
                  type="button"
                  className="description-modal-close"
                  onClick={() => setOpen(false)}
                  aria-label="بستن"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="description-modal-body">
                <p style={{ whiteSpace: "pre-line" }}>{description}</p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}