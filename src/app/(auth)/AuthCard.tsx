// src/app/(auth)/AuthCard.tsx
"use client";

import { useState } from "react";
import { User, Mail, Phone, X } from "lucide-react";
import { signIn, signUp, requestPasswordResetOtp, resetPasswordWithOtp } from "./actions";
import PasswordInput from "./PasswordInput";
import GridScanBackground from "@/components/backgrounds/GridScanBackground";

type AnimationStyle = React.CSSProperties & {
  "--D"?: number;
  "--S"?: number;
  "--li"?: number;
};

export default function AuthCard({
  initialMode,
  redirectTo,
}: {
  initialMode: "login" | "register";
  redirectTo?: string;
}) {
  const [isRegisterActive, setIsRegisterActive] = useState(
    initialMode === "register"
  );

  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);

   // State مودال (بازنشانی با OTP)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotStep, setForgotStep] = useState<"phone" | "otp" | "newPassword">("phone");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);


  async function handleLogin(formData: FormData) {
    setLoginLoading(true);
    setLoginError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setLoginError(result.error);
      setLoginLoading(false);
    }
  }

  async function handleRegister(formData: FormData) {
    setRegisterLoading(true);
    setRegisterError(null);
    const result = await signUp(formData);
    if (result?.error) {
      setRegisterError(result.error);
      setRegisterLoading(false);
    }
  }

   // مرحله ۱: ارسال کد OTP به شماره موبایل
  async function handleForgotRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    if (!forgotPhone.trim() || !/^09\d{9}$/.test(forgotPhone.trim())) {
      setForgotError("شماره موبایل معتبر نیست. مثال: 09123456789");
      return;
    }
    setForgotLoading(true);
    const result = await requestPasswordResetOtp(forgotPhone.trim());
    setForgotLoading(false);
    if (result?.error) {
      setForgotError(result.error);
    } else {
      setForgotStep("otp");
    }
  }

  // مرحله ۲: تأیید کد OTP
  async function handleForgotVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    if (!forgotOtp.trim()) {
      setForgotError("کد تأیید را وارد کنید.");
      return;
    }
    setForgotStep("newPassword");
  }

  // مرحله ۳: تنظیم رمز جدید
  async function handleForgotSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    if (forgotNewPassword.length < 6) {
      setForgotError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("رمز عبور و تکرار آن مطابقت ندارند.");
      return;
    }
    setForgotLoading(true);
    const result = await resetPasswordWithOtp(forgotPhone.trim(), forgotOtp.trim(), forgotNewPassword);
    setForgotLoading(false);
    if (result?.error) {
      setForgotError(result.error);
    } else {
      setForgotSuccess(true);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotPhone("");
        setForgotOtp("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotStep("phone");
        setForgotSuccess(false);
      }, 2500);
    }
  }

return (
  <>
    <GridScanBackground /> 
    <div className="auth-page relative z-10">
      <div className={`container${isRegisterActive ? " active" : ""}`}>
        <div className="curved-shape" />
        <div className="curved-shape2" />

        {/* فرم ورود */}
        <div className="form-box Login">
          <h2
            className="animation"
            style={{ "--D": 0, "--S": 21 } as AnimationStyle}
          >
            ورود
          </h2>
          <form action={handleLogin}>
            <input type="hidden" name="redirect" value={redirectTo ?? "/"} />
            <div className="input-box animation" style={{ "--D": 1, "--S": 22 } as AnimationStyle}>
              <input type="tel" name="phone" dir="ltr" placeholder=" " maxLength={11} required />
              <label>شماره موبایل</label>
              <Phone size={18} />
            </div>

            <PasswordInput
              name="password"
              label="رمز عبور"
              style={{ "--D": 2, "--S": 23 } as AnimationStyle}
            />

           <div
              className="forgot-link animation"
              style={{ "--D": 2, "--S": 23 } as AnimationStyle}
            >
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-sm underline hover:no-underline"
              >
                رمز عبور را فراموش کرده‌اید؟
              </button>
            </div>

            {loginError && <p className="error-message">{loginError}</p>}

            <div
              className="input-box animation"
              style={{ "--D": 3, "--S": 24 } as AnimationStyle}
            >
              <button className="btn" type="submit" disabled={loginLoading}>
                {loginLoading ? "در حال ورود..." : "ورود"}
              </button>
            </div>

            <div
              className="regi-link animation"
              style={{ "--D": 4, "--S": 25 } as AnimationStyle}
            >
              <p>
                حساب کاربری ندارید؟
                <br />
                <button type="button" onClick={() => setIsRegisterActive(true)}>
                  ثبت نام
                </button>
              </p>
            </div>
          </form>
        </div>

        <div className="info-content Login">
          <h2
            className="animation"
            style={{ "--D": 0, "--S": 20 } as AnimationStyle}
          >
            خوش آمدید به سبزفراز!
          </h2>
          <p
            className="animation"
            style={{ "--D": 1, "--S": 21 } as AnimationStyle}
          >
            خوشحالیم که دوباره کنار ما هستید. برای ادامه‌ی خرید، وارد حساب‌تان
            شوید.
          </p>
        </div>

        {/* فرم ثبت‌نام */}
        <div className="form-box Register">
          <h2
            className="animation"
            style={{ "--li": 17, "--S": 0 } as AnimationStyle}
          >
            ثبت نام
          </h2>
          <form action={handleRegister}>
           <div
              className="input-box animation"
              style={{ "--li": 18, "--S": 1 } as AnimationStyle}
            >
              <input type="text" name="fullName" required />
              <label>نام و نام خانوادگی</label>
              <User size={18} />
            </div>

            <div
              className="input-box animation"
              style={{ "--li": 19, "--S": 2 } as AnimationStyle}
            >
              <input type="tel" name="phone" dir="ltr" maxLength={11} required />
              <label>شماره موبایل</label>
              <Phone size={18} />
            </div>

            <div
              className="input-box animation"
              style={{ "--li": 19, "--S": 2.5 } as AnimationStyle}
            >
              <input type="email" name="email" dir="ltr" />
              <label>ایمیل (اختیاری)</label>
              <Mail size={18} />
            </div>
            <PasswordInput
              name="password"
              label="رمز عبور"
              style={{ "--li": 19, "--S": 3 } as AnimationStyle}
            />

            {registerError && <p className="error-message">{registerError}</p>}

            <div
              className="input-box animation"
              style={{ "--li": 20, "--S": 4 } as AnimationStyle}
            >
              <button className="btn" type="submit" disabled={registerLoading}>
                {registerLoading ? "در حال ثبت‌نام..." : "ثبت نام"}
              </button>
            </div>

            <div
              className="regi-link animation"
              style={{ "--li": 21, "--S": 5 } as AnimationStyle}
            >
              <p>
                حساب کاربری دارید؟
                <br />
                <button
                  type="button"
                  onClick={() => setIsRegisterActive(false)}
                >
                  ورود
                </button>
              </p>
            </div>
          </form>
        </div>

        <div className="info-content Register">
          <h2
            className="animation"
            style={{ "--li": 17, "--S": 0 } as AnimationStyle}
          >
            به سبزفراز خوش آمدید!
          </h2>
          <p
            className="animation"
            style={{ "--li": 18, "--S": 1 } as AnimationStyle}
          >
            با ساخت حساب کاربری، از تخفیف‌های ویژه و پیگیری سفارش‌هایتان
            بهره‌مند شوید.
          </p>
        </div>
      </div>

      {/* مودال فراموشی رمز عبور */}
      {isForgotModalOpen && (
        <div
          className="forgot-modal-overlay"
          onClick={() => setIsForgotModalOpen(false)}
        >
          <div
            className="forgot-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="forgot-modal-close"
              onClick={() => setIsForgotModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h2 className="forgot-modal-title">بازیابی رمز عبور</h2>

            {forgotSuccess ? (
              <p className="forgot-modal-success">
                رمز عبور شما با موفقیت تغییر یافت. می‌توانید وارد شوید.
              </p>
            ) : forgotStep === "phone" ? (
              <form onSubmit={handleForgotRequestOtp} className="forgot-form">
                <div className="forgot-input-box">
                  <input
                    type="tel"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    dir="ltr"
                    maxLength={11}
                    required
                    placeholder=" "
                  />
                  <label>شماره موبایل</label>
                </div>
                {forgotError && <p className="forgot-error-message">{forgotError}</p>}
                <div className="forgot-input-box">
                  <button className="forgot-btn" type="submit" disabled={forgotLoading}>
                    {forgotLoading ? "در حال ارسال..." : "ارسال کد بازیابی"}
                  </button>
                </div>
              </form>
            ) : forgotStep === "otp" ? (
              <form onSubmit={handleForgotVerifyOtp} className="forgot-form">
                <p className="text-sm text-gray-300 mb-2">
                  کد ۶ رقمی به شماره {forgotPhone} پیامک شد.
                </p>
                <div className="forgot-input-box">
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    dir="ltr"
                    maxLength={6}
                    required
                    placeholder=" "
                  />
                  <label>کد بازیابی</label>
                </div>
                {forgotError && <p className="forgot-error-message">{forgotError}</p>}
                <div className="forgot-input-box">
                  <button className="forgot-btn" type="submit">تأیید کد</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotSetPassword} className="forgot-form">
                <PasswordInput
                  name="newPassword"
                  label="رمز عبور جدید"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  style={{}}
                />
                <PasswordInput
                  name="confirmNewPassword"
                  label="تکرار رمز عبور جدید"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  style={{}}
                />
                {forgotError && <p className="forgot-error-message">{forgotError}</p>}
                <div className="forgot-input-box">
                  <button className="forgot-btn" type="submit" disabled={forgotLoading}>
                    {forgotLoading ? "در حال تغییر..." : "ثبت رمز جدید"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* استایل‌های مودال هماهنگ با auth.css */}
      <style jsx>{`
        /* Overlay */
        .forgot-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* محتوای مودال */
        .forgot-modal-content {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 2px solid #4a9eff;
          box-shadow: 0 0 25px #4a9eff;
          border-radius: 15px;
          padding: 40px 36px;
          width: 90%;
          max-width: 400px;
          position: relative;
          direction: rtl;
          color: #fff;
          animation: scaleIn 0.3s ease;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* دکمه بستن */
        .forgot-modal-close {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #fff;
          transition: color 0.3s;
        }
        .forgot-modal-close:hover {
          color: #4a9eff;
        }

        /* عنوان */
        .forgot-modal-title {
          font-size: 24px;
          text-align: center;
          margin-bottom: 1.5rem;
          color: #fff;
        }

        /* پیام موفقیت */
        .forgot-modal-success {
          color: #4a9eff;
          text-align: center;
          font-size: 1rem;
        }

        /* فرم داخل مودال */
        .forgot-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* باکس ورودی (شبیه input-box در auth.css) */
        .forgot-input-box {
          position: relative;
          width: 100%;
          height: 50px;
          margin-top: 22px;
        }
        .forgot-input-box input {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 16px;
          color: #fff;
          font-weight: 600;
          border-bottom: 2px solid #fff;
          padding-right: 23px;
          padding-left: 23px;
          text-align: right;
          direction: rtl;
          transition: 0.5s;
        }
        .forgot-input-box input:focus,
        .forgot-input-box input:valid {
          border-bottom-color: #4a9eff;
        }
        .forgot-input-box label {
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          font-size: 16px;
          color: #fff;
          transition: 0.5s;
          pointer-events: none;
        }
        .forgot-input-box input:focus ~ label,
        .forgot-input-box input:valid ~ label,
        .forgot-input-box input:not(:placeholder-shown) ~ label {
          top: -5px;
          color: #4a9eff;
        }

        /* دکمه ارسال */
        .forgot-btn {
          position: relative;
          width: 100%;
          height: 45px;
          background: transparent;
          border-radius: 40px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          border: 2px solid #4a9eff;
          overflow: hidden;
          z-index: 1;
          margin-top: 22px;
          color: #fff;
        }
        .forgot-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .forgot-btn::before {
          content: "";
          position: absolute;
          height: 300%;
          width: 100%;
          background: linear-gradient(#1a1a2e, #4a9eff, #1a1a2e, #4a9eff);
          top: -100%;
          left: 0;
          z-index: -1;
          transition: 0.5s;
        }
        .forgot-btn:hover::before {
          top: 0;
        }

        /* خطا */
        .forgot-error-message {
          color: #ff8080 !important;
          font-size: 13px;
          margin-top: 5px;
          text-align: center;
        }

        /* تنظیمات کامپوننت‌های داخلی (PasswordInput) */
        .forgot-form :global(.input-box) {
          margin-top: 22px;
          position: relative;
          height: 50px;
        }
        .forgot-form :global(.input-box input) {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 16px;
          color: #fff;
          font-weight: 600;
          border-bottom: 2px solid #fff;
          padding-right: 23px;
          padding-left: 23px;
          text-align: right;
          direction: rtl;
          transition: 0.5s;
        }
        .forgot-form :global(.input-box input:focus),
        .forgot-form :global(.input-box input:valid) {
          border-bottom-color: #4a9eff;
        }
        .forgot-form :global(.input-box label) {
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          font-size: 16px;
          color: #fff;
          transition: 0.5s;
          pointer-events: none;
        }
        .forgot-form :global(.input-box input:focus ~ label),
        .forgot-form :global(.input-box input:valid ~ label) {
          top: -5px;
          color: #4a9eff;
        }
        /* استایل دکمه نمایش/پنهان رمز در مودال */
        .forgot-form :global(.input-box .password-toggle-btn) {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          color: #fff;
          z-index: 2;
          transition: color 0.5s;
        }
        .forgot-form :global(.input-box input:focus ~ .password-toggle-btn),
        .forgot-form :global(.input-box input:valid ~ .password-toggle-btn) {
          color: #4a9eff;
        }
      `}</style>
    </div>
  </>  // 👈 این خط آخر رو حتما اضافه کن!
);
}