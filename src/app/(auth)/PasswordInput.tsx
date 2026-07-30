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
        minLength={6}
        value={value}
        onChange={onChange}
        placeholder=" "
      />

      {/* دکمه‌ی نمایش/پنهان با span و استایل inline برای قطعیت */}
      <span
        onClick={toggleVisibility}
        onMouseDown={(e) => e.preventDefault()} // جلوگیری از گرفتن فوکوس توسط input
        role="button"
        tabIndex={-1}
        aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
        style={{
          position: "absolute",
          top: "50%",
          left: "0",               // سمت چپ (با توجه به RTL، دکمه در سمت راست بصری قرار می‌گیرد)
          transform: "translateY(-50%)",
          zIndex: 10,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          color: "inherit",        // رنگ را از auth.css به ارث می‌برد
          transition: "color 0.3s",
          pointerEvents: "auto",
        }}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </span>

      <label>{label}</label>
    </div>
  );
}