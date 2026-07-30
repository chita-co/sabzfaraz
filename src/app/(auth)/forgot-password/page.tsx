"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetOtp, resetPasswordWithOtp } from "../actions";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await requestPasswordResetOtp(phone);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setStep("reset");
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }
    setLoading(true);
    const result = await resetPasswordWithOtp(phone, code, password);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="auth-page">
      <div className="single-box">
        <h2>فراموشی رمز عبور</h2>

        {success ? (
          <>
            <p className="subtitle">رمز عبور شما با موفقیت تغییر کرد.</p>
            <Link href="/login" className="btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              ورود به حساب کاربری
            </Link>
          </>
        ) : step === "phone" ? (
          <>
            <p className="subtitle">شماره موبایل حساب کاربری‌تان را وارد کنید تا کد تایید برایتان پیامک شود.</p>
            <form onSubmit={handleRequestOtp}>
              <div className="input-box">
                <input type="tel" dir="ltr" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <label>شماره موبایل</label>
              </div>
              {error && <p className="error-message">{error}</p>}
              <div className="input-box">
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "در حال ارسال..." : "ارسال کد تایید"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="subtitle">کد تایید ارسال‌شده به {phone} و رمز عبور جدید را وارد کنید.</p>
            <form onSubmit={handleReset}>
              <div className="input-box">
                <input type="text" dir="ltr" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
                <label>کد تایید</label>
              </div>
              <div className="input-box">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <label>رمز عبور جدید</label>
              </div>
              <div className="input-box">
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                <label>تکرار رمز عبور جدید</label>
              </div>
              {error && <p className="error-message">{error}</p>}
              <div className="input-box">
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? "در حال ثبت..." : "تغییر رمز عبور"}
                </button>
              </div>
            </form>
          </>
        )}

        <div className="regi-link">
          <Link href="/login">بازگشت به صفحه‌ی ورود</Link>
        </div>
      </div>
    </div>
  );
}