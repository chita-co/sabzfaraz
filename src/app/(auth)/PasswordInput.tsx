// src/app/(auth)/PasswordInput.tsx
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  name: string;
  label: string;
  style?: React.CSSProperties;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function PasswordInput({
  name,
  label,
  style,
  value,
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = () => {
    setVisible((prev) => !prev);
  };

  return (
    <div className="input-box animation" style={style}>
      <input
        type={visible ? "text" : "password"}
        name={name}
        required
        value={value}
        onChange={onChange}
        placeholder=" "
      />

      {/* دکمه‌ی نمایش/پنهان با span و استایل inline برای قطعیت */}
      <span
  className="password-toggle-btn"
  onClick={toggleVisibility}
  onMouseDown={(e) => e.preventDefault()}
  role="button"
  tabIndex={-1}
  aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
>
  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
</span>

      <label>{label}</label>
    </div>
  );
}