"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="custom-select" ref={ref}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={selected ? "" : "custom-select-placeholder"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`custom-select-chevron${open ? " open" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="custom-select-menu">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`custom-select-option${o.value === value ? " active" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
          {options.length === 0 && <p className="custom-select-empty">ابتدا استان را انتخاب کنید</p>}
        </div>
      )}
    </div>
  );
}