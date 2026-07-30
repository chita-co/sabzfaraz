"use client";

export default function AdminSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="admin-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="admin-switch-track" />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}