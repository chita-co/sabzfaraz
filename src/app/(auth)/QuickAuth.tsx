// src/app/(auth)/QuickAuth.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { User, Phone, CreditCard, Mail, X } from "lucide-react";
import {
  requestQuickSignupOtp,
  verifyQuickSignupOtp,
  requestQuickLoginOtp,
  verifyQuickLoginOtp,
} from "./quick-actions";
import { toEnglishDigits } from "@/lib/nationalId";
import "./quick-auth.css";

type AnimationStyle = React.CSSProperties & {
  "--D"?: number;
  "--S"?: number;
  "--li"?: number;
};

export const onlyDigits = (v: string, max: number) =>
  toEnglishDigits(v).replace(/\D/g, "").slice(0, max);

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function ErrorPopup({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <Portal>
      <div className="qa-overlay qa-top">
        <div className="qa-box" role="alertdialog">
          <div className="qa-icon">!</div>
          <p className="qa-text">{message}</p>
          <button type="button" className="qa-btn" onClick={onClose}>
            متوجه شدم
          </button>
        </div>
      </div>
    </Portal>
  );
}

export function LoadingPopup({ text }: { text: string }) {
  return (
    <Portal>
      <div className="qa-overlay qa-loading">
        <div className="qa-box">
          <div className="qa-spinner" />
          <p className="qa-text qa-nomargin">{text}</p>
        </div>
      </div>
    </Portal>
  );
}

function OtpDialog({
  phone,
  onClose,
  onVerify,
  onResend,
  onError,
}: {
  phone: string;
  onClose: () => void;
  onVerify: (code: string) => Promise<{ error?: string } | void>;
  onResend: () => Promise<{ error?: string } | void>;
  onError: (msg: string) => void;
}) {
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(120);
  const [busy, setBusy] = useState<"verify" | "resend" | null>(null);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 4) {
      onError("رمز ۴ رقمی را کامل وارد کنید.");
      return;
    }
    setBusy("verify");
    const res = await onVerify(code);
    setBusy(null);
    if (res && res.error) onError(res.error);
    // در صورت موفقیت، سرور ریدایرکت می‌کند
  }

  async function resend() {
    setBusy("resend");
    const res = await onResend();
    setBusy(null);
    if (res && res.error) {
      onError(res.error);
    } else {
      setCode("");
      setTimer(120);
    }
  }

  return (
    <>
      <Portal>
        <div className="qa-overlay">
          <div className="qa-box qa-box-otp">
            <button type="button" className="qa-close" onClick={onClose}>
              <X size={20} />
            </button>
            <h2 className="qa-title">رمز یکبار مصرف</h2>

            <form onSubmit={submit} className="qa-form">
              <p className="qa-hint">رمز ۴ رقمی به شماره {phone} پیامک شد.</p>
              <div className="qa-input-box">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  dir="ltr"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(onlyDigits(e.target.value, 4))}
                  placeholder=" "
                  autoFocus
                />
                <label>رمز ۴ رقمی</label>
              </div>

              {timer > 0 ? (
                <p className="qa-timer">
                  {`${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")} تا پایان اعتبار رمز`}
                </p>
              ) : (
                <button type="button" className="qa-btn" onClick={resend} disabled={busy !== null}>
                  ارسال مجدد رمز
                </button>
              )}

              <button className="qa-btn" type="submit" disabled={busy !== null || timer <= 0}>
                ورود
              </button>
            </form>
          </div>
        </div>
      </Portal>
      {busy === "verify" && <LoadingPopup text="در حال ورود..." />}
      {busy === "resend" && <LoadingPopup text="در حال ارسال رمز..." />}
    </>
  );
}

// ============================================================
// ثبت‌نام سریع (نام، موبایل، کدملی) — بدون احراز هویت
// ============================================================
export function QuickSignupForm({
  hidden,
  onGoLogin,
}: {
  hidden?: boolean;
  onGoLogin: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);

  function buildFd(code?: string) {
    const fd = new FormData();
    fd.append("fullName", fullName.trim());
    fd.append("phone", phone);
    fd.append("nationalId", nationalId);
    fd.append("email", email.trim());
    if (code) fd.append("code", code);
    return fd;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await requestQuickSignupOtp(buildFd());
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setOtpOpen(true);
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate style={hidden ? { display: "none" } : undefined}>
        <div className="input-box animation" style={{ "--li": 18, "--S": 1 } as AnimationStyle}>
          <input type="text" required placeholder=" " value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <label>نام و نام خانوادگی</label>
          <User size={18} />
        </div>

        <div className="input-box animation" style={{ "--li": 19, "--S": 2 } as AnimationStyle}>
          <input
            type="tel" dir="ltr" maxLength={11} required placeholder=" "
            value={phone} onChange={(e) => setPhone(onlyDigits(e.target.value, 11))}
          />
          <label>شماره موبایل</label>
          <Phone size={18} />
        </div>

        <div className="input-box animation" style={{ "--li": 19, "--S": 2.3 } as AnimationStyle}>
          <input
            type="text" dir="ltr" maxLength={10} required placeholder=" "
            value={nationalId} onChange={(e) => setNationalId(onlyDigits(e.target.value, 10))}
          />
          <label>کد ملی</label>
          <CreditCard size={18} />
        </div>

        <div className="input-box animation" style={{ "--li": 19, "--S": 2.6 } as AnimationStyle}>
          <input
            type="email" dir="ltr" placeholder=" "
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <label>ایمیل (اختیاری)</label>
          <Mail size={18} />
        </div>

        <div className="input-box animation" style={{ "--li": 20, "--S": 4 } as AnimationStyle}>
          <button className="btn" type="submit" disabled={loading}>
            ورود با رمز یکبار مصرف
          </button>
        </div>

        <div className="regi-link animation" style={{ "--li": 21, "--S": 5 } as AnimationStyle}>
          <p>
            حساب کاربری دارید؟
            <br />
            <button type="button" onClick={onGoLogin}>ورود</button>
          </p>
        </div>
      </form>

      {loading && <LoadingPopup text="در حال ورود..." />}
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
      {otpOpen && (
        <OtpDialog
          phone={phone}
          onClose={() => setOtpOpen(false)}
          onVerify={(code) => verifyQuickSignupOtp(buildFd(code))}
          onResend={() => requestQuickSignupOtp(buildFd())}
          onError={(m) => setError(m)}
        />
      )}
    </>
  );
}

// ============================================================
// ورود سریع (فقط موبایل + رمز یکبار مصرف)
// ============================================================
export function QuickLoginForm({
  hidden,
  redirectTo,
  onGoRegister,
}: {
  hidden?: boolean;
  redirectTo?: string;
  onGoRegister: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);

  function buildFd(code?: string) {
    const fd = new FormData();
    fd.append("phone", phone);
    fd.append("redirect", redirectTo ?? "/");
    if (code) fd.append("code", code);
    return fd;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await requestQuickLoginOtp(buildFd());
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setOtpOpen(true);
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate style={hidden ? { display: "none" } : undefined}>
        <div className="input-box animation" style={{ "--D": 1, "--S": 22 } as AnimationStyle}>
          <input
            type="tel" dir="ltr" maxLength={11} required placeholder=" "
            value={phone} onChange={(e) => setPhone(onlyDigits(e.target.value, 11))}
          />
          <label>شماره موبایل</label>
          <Phone size={18} />
        </div>

        <div className="input-box animation" style={{ "--D": 2, "--S": 23 } as AnimationStyle}>
          <button className="btn" type="submit" disabled={loading}>
            ورود
          </button>
        </div>

        <div className="regi-link animation" style={{ "--D": 3, "--S": 24 } as AnimationStyle}>
          <p>
            حساب کاربری ندارید؟
            <br />
            <button type="button" onClick={onGoRegister}>ثبت نام</button>
          </p>
        </div>
      </form>

      {loading && <LoadingPopup text="در حال ارسال رمز..." />}
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
      {otpOpen && (
        <OtpDialog
          phone={phone}
          onClose={() => setOtpOpen(false)}
          onVerify={(code) => verifyQuickLoginOtp(buildFd(code))}
          onResend={() => requestQuickLoginOtp(buildFd())}
          onError={(m) => setError(m)}
        />
      )}
    </>
  );
}