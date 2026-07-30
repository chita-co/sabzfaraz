"use client";

import { Star } from "lucide-react";

export function StarRatingDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= Math.round(value) ? "#f59e0b" : "none"} color="#f59e0b" />
      ))}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)}>
          <Star size={22} fill={i <= value ? "#f59e0b" : "none"} color="#f59e0b" />
        </button>
      ))}
    </div>
  );
}