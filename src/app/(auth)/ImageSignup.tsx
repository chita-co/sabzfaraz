// src/app/(auth)/ImageSignup.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { User, Phone, CreditCard, Mail, ImagePlus } from "lucide-react";
import PasswordInput from "./PasswordInput";
import { ErrorPopup, LoadingPopup, onlyDigits } from "./QuickAuth";
import { registerWithImage } from "./image-signup-actions";
import { isValidIranianNationalId } from "@/lib/nationalId";

type AnimationStyle = React.CSSProperties & {
  "--D"?: number;
  "--S"?: number;
  "--li"?: number;
};

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// کوچک‌کردن تصویر در مرورگر (برای عبور از محدودیت حجم درخواست)؛ فشرده‌سازی نهایی در سرور انجام می‌شود
async function compressImage(file: File): Promise<File> {
  if (file.size <= 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], "document.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export default function ImageSignupForm({
  hidden,
  onGoLogin,
}: {
  hidden?: boolean;
  onGoLogin: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    if (!ALLOWED.includes(f.type)) {
      setError("فرمت تصویر باید JPG، PNG یا WEBP باشد.");
      return;
    }

    const processed = await compressImage(f);
    if (processed.size > MAX_BYTES) {
      setError("حجم تصویر نباید بیشتر از ۴ مگابایت باشد.");
      return;
    }
    setFile(processed);
    setPreview(URL.createObjectURL(processed));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    const mail = email.trim();
    if (!name) return setError("نام و نام خانوادگی را وارد کنید.");
    if (!/^09\d{9}$/.test(phone)) return setError("شماره موبایل معتبر نیست. مثال: 09123456789");
    if (!isValidIranianNationalId(nationalId)) return setError("کد ملی وارد شده معتبر نیست.");
    if (password.length < 6) return setError("رمز ورود باید حداقل ۶ کاراکتر باشد.");
    if (password.length > 72) return setError("رمز ورود نباید بیشتر از ۷۲ کاراکتر باشد.");
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      return setError("فرمت ایمیل وارد شده صحیح نیست. مثال: name@example.com");
    }
    if (!file) return setError("تصویر کارت ملی یا گواهینامه را انتخاب کنید.");

    const fd = new FormData();
    fd.append("fullName", name);
    fd.append("phone", phone);
    fd.append("nationalId", nationalId);
    fd.append("password", password);
    fd.append("email", mail);
    fd.append("document", file);

    setLoading(true);
    const res = await registerWithImage(fd);
    setLoading(false);
    if (res?.error) setError(res.error);
    // در صورت موفقیت، سرور ریدایرکت می‌کند
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate style={hidden ? { display: "none" } : undefined}>
        <div className="input-box animation" style={{ "--li": 18, "--S": 1 } as AnimationStyle}>
          <input type="text" required placeholder=" " value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <label>نام و نام خانوادگی</label>
          <User size={18} />
        </div>

        <div className="input-box animation" style={{ "--li": 18.5, "--S": 1.5 } as AnimationStyle}>
          <input
            type="tel" dir="ltr" maxLength={11} required placeholder=" "
            value={phone} onChange={(e) => setPhone(onlyDigits(e.target.value, 11))}
          />
          <label>شماره موبایل</label>
          <Phone size={18} />
        </div>

        <div className="input-box animation" style={{ "--li": 19, "--S": 2 } as AnimationStyle}>
          <input
            type="text" dir="ltr" maxLength={10} required placeholder=" "
            value={nationalId} onChange={(e) => setNationalId(onlyDigits(e.target.value, 10))}
          />
          <label>کد ملی</label>
          <CreditCard size={18} />
        </div>

        <PasswordInput
          name="imagePassword"
          label="رمز ورود (حداقل ۶ کاراکتر)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ "--li": 19.5, "--S": 2.5 } as AnimationStyle}
        />

        <div className="input-box animation" style={{ "--li": 20, "--S": 3 } as AnimationStyle}>
          <input
            type="email" dir="ltr" placeholder=" "
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <label>ایمیل (اختیاری)</label>
          <Mail size={18} />
        </div>

        <div className="input-box animation" style={{ "--li": 20.5, "--S": 3.5 } as AnimationStyle}>
          <button
            type="button"
            className={`auth-file-btn${file ? " has-file" : ""}`}
            onClick={() => fileRef.current?.click()}
          >
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="auth-file-thumb" />
            )}
            {file && !preview && <b className="auth-file-pdf">PDF</b>}
            <span>{file ? file.name : "تصویر کارت ملی / گواهینامه"}</span>
          </button>
          <ImagePlus size={18} />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFile}
        />

        <div className="input-box animation" style={{ "--li": 21, "--S": 4 } as AnimationStyle}>
          <button className="btn" type="submit" disabled={loading}>
            ثبت نام
          </button>
        </div>

        <div className="regi-link animation" style={{ "--li": 22, "--S": 5 } as AnimationStyle}>
          <p>
            حساب کاربری دارید؟
            <br />
            <button type="button" onClick={onGoLogin}>ورود</button>
          </p>
        </div>
      </form>

      {loading && <LoadingPopup text="در حال ورود..." />}
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
    </>
  );
}