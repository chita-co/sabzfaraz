// src/app/(auth)/AuthCard.tsx
"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, CreditCard, X } from "lucide-react";
import { signIn, requestSignupOtp, verifySignupOtpAndCreateAccount, requestPasswordResetOtp, resetPasswordWithOtp } from "./actions";
import { toEnglishDigits } from "@/lib/nationalId";
import PasswordInput from "./PasswordInput";
import { QuickSignupForm, QuickLoginForm } from "./QuickAuth";
import ImageSignupForm from "./ImageSignup";
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
  const [loginTab, setLoginTab] = useState<"password" | "otp">("password");
  const [registerTab, setRegisterTab] = useState<"full" | "quick" | "image">("full");

  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [nationalIdInput, setNationalIdInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  // State مودال تایید ثبت‌نام با پیامک
  const [pendingRegistration, setPendingRegistration] = useState<{
    fullName: string; phone: string; nationalId: string; email: string; password: string;
  } | null>(null);
  const [isRegisterOtpOpen, setIsRegisterOtpOpen] = useState(false);
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerOtpError, setRegisterOtpError] = useState<string | null>(null);
  const [registerOtpLoading, setRegisterOtpLoading] = useState(false);
  const [registerOtpTimer, setRegisterOtpTimer] = useState(120);
  const [registerResendAvailable, setRegisterResendAvailable] = useState(false);

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

  // تایمر ۱۲۰ ثانیه‌ای برای کد OTP
  const [otpTimer, setOtpTimer] = useState(120);
  const [resendAvailable, setResendAvailable] = useState(false);

  useEffect(() => {
    if (forgotStep === "otp") {
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setResendAvailable(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [forgotStep]);

  useEffect(() => {
    if (!isRegisterOtpOpen) return;
    if (registerResendAvailable) return;
    const interval = setInterval(() => {
      setRegisterOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRegisterResendAvailable(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRegisterOtpOpen, registerResendAvailable]);


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

    const fullName = (formData.get("fullName") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const nationalId = (formData.get("nationalId") as string) || "";
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";

    if (!firstNameInput.trim() || !lastNameInput.trim()) {
  setRegisterError("نام و نام خانوادگی هر دو اجباری هستند.");
  setRegisterLoading(false);
  return;
}

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setRegisterError("فرمت ایمیل وارد شده صحیح نیست.");
      setRegisterLoading(false);
      return;
    }

    if (password.length < 6) {
      setRegisterError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      setRegisterLoading(false);
      return;
    }

    const result = await requestSignupOtp(formData);
    setRegisterLoading(false);
    if (result?.error) {
      setRegisterError(result.error);
      return;
    }
    setPendingRegistration({ fullName, phone, nationalId, email, password });
    setRegisterOtp("");
    setRegisterOtpError(null);
    setRegisterOtpTimer(120);
    setRegisterResendAvailable(false);
    setIsRegisterOtpOpen(true);
  }

  function buildPendingFormData() {
    const fd = new FormData();
    if (!pendingRegistration) return fd;
    fd.append("fullName", pendingRegistration.fullName);
    fd.append("phone", pendingRegistration.phone);
    fd.append("nationalId", pendingRegistration.nationalId);
    fd.append("email", pendingRegistration.email);
    fd.append("password", pendingRegistration.password);
    return fd;
  }

  async function handleRegisterOtpResend() {
    setRegisterOtpLoading(true);
    setRegisterOtpError(null);
    const result = await requestSignupOtp(buildPendingFormData());
    setRegisterOtpLoading(false);
    if (result?.error) {
      setRegisterOtpError(result.error);
    } else {
      setRegisterOtpTimer(120);
      setRegisterResendAvailable(false);
    }
  }

  async function handleRegisterOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setRegisterOtpError(null);
    if (!registerOtp.trim()) {
      setRegisterOtpError("کد تایید را وارد کنید.");
      return;
    }
    setRegisterOtpLoading(true);
    const fd = buildPendingFormData();
    fd.append("code", registerOtp.trim());
    const result = await verifySignupOtpAndCreateAccount(fd);
    setRegisterOtpLoading(false);
    if (result?.error) {
      setRegisterOtpError(result.error);
    }
    // در صورت موفقیت، خود سرور اکشن ریدایرکت به "/" را انجام می‌دهد
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
      setOtpTimer(120);
      setResendAvailable(false);
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
        setOtpTimer(120);
        setResendAvailable(false);
      }, 2500);
    }
  }

  return (
    <>
      <GridScanBackground />
      <div className="auth-page relative z-10">
        <div className={`container${isRegisterActive ? " active" : ""}`}>

          {/* تب‌های پوشه‌ای ورود / ثبت‌نام */}
<div className="auth-mode-switch" role="tablist">
  <button
    type="button"
    role="tab"
    aria-selected={!isRegisterActive}
    className={!isRegisterActive ? "on" : ""}
    onClick={() => setIsRegisterActive(false)}
  >
    <span className="tab-title">صفحه ورود</span>
    <span className="tab-sub">حساب کاربری دارم</span>
  </button>
  <button
    type="button"
    role="tab"
    aria-selected={isRegisterActive}
    className={isRegisterActive ? "on" : ""}
    onClick={() => setIsRegisterActive(true)}
  >
    <span className="tab-title">{isRegisterActive ? "ثبت نام" : "ثبت نام جدید"}</span>
    <span className="tab-sub">تازه میخوام ثبت نام کنم</span>
  </button>
</div>

          {/* فرم ورود */}
          <div className="form-box Login">
            <h2
              className="animation"
              style={{ "--D": 0, "--S": 21 } as AnimationStyle}
            >
              ورود
            </h2>
            <div className="auth-tabs animation" style={{ "--D": 0.5, "--S": 21.5 } as AnimationStyle}>
              <button type="button" className={loginTab === "password" ? "on" : ""} onClick={() => setLoginTab("password")}>
                ورود با رمز
              </button>
              <button type="button" className={loginTab === "otp" ? "on" : ""} onClick={() => setLoginTab("otp")}>
                رمز یکبار مصرف
              </button>
            </div>
            <form action={handleLogin} style={loginTab === "password" ? undefined : { display: "none" }}>
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
            <QuickLoginForm
              hidden={loginTab !== "otp"}
              redirectTo={redirectTo}
              onGoRegister={() => setIsRegisterActive(true)}
            />
          </div>

          {/* فرم ثبت‌نام */}
          <div className="form-box Register">
            <h2
              className="animation"
              style={{ "--li": 17, "--S": 0 } as AnimationStyle}
            >
              ثبت نام
            </h2>
            <div className="auth-tabs animation" style={{ "--li": 17.5, "--S": 0.5 } as AnimationStyle}>
              <button type="button" className={registerTab === "full" ? "on" : ""} onClick={() => setRegisterTab("full")}>
                ثبت نام کامل
              </button>
              <button type="button" className={registerTab === "quick" ? "on" : ""} onClick={() => setRegisterTab("quick")}>
                ثبت نام سریع
              </button>
              <button type="button" className={registerTab === "image" ? "on" : ""} onClick={() => setRegisterTab("image")}>
                ثبت نام با تصویر
              </button>
            </div>
            <form action={handleRegister} noValidate style={registerTab === "full" ? undefined : { display: "none" }}>

              <div className="input-box animation" style={{ "--li": 18, "--S": 1 } as AnimationStyle}>
  <input type="text" name="firstName" placeholder=" " required value={firstNameInput} onChange={(e) => setFirstNameInput(e.target.value)} />
  <label>نام</label>
  <User size={18} />
</div>

<div className="input-box animation" style={{ "--li": 18.5, "--S": 1.5 } as AnimationStyle}>
  <input type="text" name="lastName" placeholder=" " required value={lastNameInput} onChange={(e) => setLastNameInput(e.target.value)} />
  <label>نام خانوادگی</label>
  <User size={18} />
</div>

<input type="hidden" name="fullName" value={`${firstNameInput.trim()} ${lastNameInput.trim()}`.trim()} />

              <div
                className="input-box animation"
                style={{ "--li": 19, "--S": 2 } as AnimationStyle}
              >
                <input type="tel" name="phone" dir="ltr" placeholder=" " maxLength={11} required value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
                <label>
  <span className="label-main">
    شماره موبایل <span className="req-star">*</span>
  </span>
  <small className="label-note">
    (شماره موبایل و کدملی متعلق به یک شخص باشد)
  </small>
</label>        <Phone size={18} />
              </div>

              <div
                className="input-box animation"
                style={{ "--li": 19, "--S": 2.3 } as AnimationStyle}
              >
                <input
                  type="text"
                  name="nationalId"
                  dir="ltr"
                  placeholder=" "
                  maxLength={10}
                  required
                  value={nationalIdInput}
                  onChange={(e) => setNationalIdInput(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 10))}
                />
                <label>کد ملی</label>
                <CreditCard size={18} />
              </div>

              <div
                className="input-box animation"
                style={{ "--li": 19, "--S": 2.5 } as AnimationStyle}
              >
                <input type="email" name="email" dir="ltr" placeholder=" " value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
                <label>ایمیل (اختیاری)</label>
                <Mail size={18} />
              </div>
              <PasswordInput
                name="password"
                label="رمز ورود (حداقل ۶ کاراکتر)"
                style={{ "--li": 19, "--S": 3 } as AnimationStyle}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />

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
            <QuickSignupForm
              hidden={registerTab !== "quick"}
              onGoLogin={() => setIsRegisterActive(false)}
            />
            <ImageSignupForm
              hidden={registerTab !== "image"}
              onGoLogin={() => setIsRegisterActive(false)}
            />
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
                      id="forgot-phone"
                      name="forgotPhone"
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
                      id="forgot-otp"
                      name="forgotOtp"
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
                  {resendAvailable ? (
                    <div className="forgot-input-box">
                      <button
                        type="button"
                        className="forgot-btn"
                        onClick={handleForgotRequestOtp}
                        disabled={forgotLoading}
                      >
                        {forgotLoading ? "در حال ارسال..." : "ارسال مجدد کد"}
                      </button>
                    </div>
                  ) : (
                    <p className="forgot-timer">
                      {`${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, "0")} تا پایان اعتبار کد`}
                    </p>
                  )}
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

        {/* مودال تایید ثبت‌نام با پیامک */}
        {isRegisterOtpOpen && pendingRegistration && (
          <div className="forgot-modal-overlay">
            <div className="forgot-modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="forgot-modal-close"
                onClick={() => { setIsRegisterOtpOpen(false); setRegisterLoading(false); }}
              >
                <X size={20} />
              </button>

              <h2 className="forgot-modal-title">تایید شماره موبایل</h2>

              <form onSubmit={handleRegisterOtpVerify} className="forgot-form">
                <p className="text-sm text-gray-300 mb-2">
                  کد ۴ رقمی به شماره {pendingRegistration.phone} پیامک شد.
                </p>
                <div className="forgot-input-box">
                  <input
                    type="text"
                    id="register-otp"
                    name="registerOtp"
                    value={registerOtp}
                    onChange={(e) => setRegisterOtp(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 4))}
                    dir="ltr"
                    maxLength={4}
                    required
                    placeholder=" "
                  />
                  <label>کد تایید</label>
                </div>
                {registerResendAvailable ? (
                  <div className="forgot-input-box">
                    <button
                      type="button"
                      className="forgot-btn"
                      onClick={handleRegisterOtpResend}
                      disabled={registerOtpLoading}
                    >
                      {registerOtpLoading ? "در حال ارسال..." : "ارسال مجدد کد"}
                    </button>
                  </div>
                ) : (
                  <p className="forgot-timer">
                    {`${Math.floor(registerOtpTimer / 60)}:${(registerOtpTimer % 60).toString().padStart(2, "0")} تا پایان اعتبار کد`}
                  </p>
                )}
                <div className="forgot-input-box">
                  <button className="forgot-btn" type="submit" disabled={registerOtpLoading}>
                    {registerOtpLoading ? "در حال بررسی..." : "تایید و ساخت حساب"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* پاپ‌آپ خطا (ثبت‌نام + کد تایید) */}
        {(registerError || registerOtpError || loginError) && (
          <div className="auth-popup-overlay">
            <div className="auth-popup-box" role="alertdialog">
              <div className="auth-popup-icon">!</div>
              <p className="auth-popup-text">{registerError || registerOtpError || loginError}</p>
              <button
                type="button"
                className="auth-popup-btn"
                onClick={() => {
                  setRegisterError(null);
                  setRegisterOtpError(null);
                  setLoginError(null);
                }}
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}

        {/* پاپ‌آپ در حال ورود */}
        {registerLoading && (
          <div className="auth-popup-overlay">
            <div className="auth-popup-box">
              <div className="auth-spinner" />
              <p className="auth-popup-text" style={{ marginBottom: 0 }}>در حال ورود...</p>
            </div>
          </div>
        )}

        {/* پاپ‌آپ در حال ورود (فرم ورود با رمز) */}
        {loginLoading && (
          <div className="auth-popup-overlay">
            <div className="auth-popup-box">
              <div className="auth-spinner" />
              <p className="auth-popup-text" style={{ marginBottom: 0 }}>در حال ورود...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}