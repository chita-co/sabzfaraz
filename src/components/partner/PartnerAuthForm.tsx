"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  loginPartnerAction, registerPartnerAction,
  requestPasswordResetAction, confirmPasswordResetAction,
} from "@/app/partner/login/actions";
import { uploadPartnerLogoAction } from "@/app/partner/products/actions";

interface CategoryOption { id: string; name: string; }

export default function PartnerAuthForm({
  categories, termsText, registrationOpen,
}: { categories: CategoryOption[]; termsText: string; registrationOpen: boolean }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);

  // ورود
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // فراموشی رمز
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "confirm">("request");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");

  // ثبت‌نام
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [sheba, setSheba] = useState("");
  const [card, setCard] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const res = await loginPartnerAction(loginPhone, loginPassword);
    setLoading(false);
    if (res?.error) toast.error(res.error);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadPartnerLogoAction(fd);
    setUploadingLogo(false);
    if (res.url) setLogoUrl(res.url);
    else toast.error(res.error ?? "خطا در آپلود لوگو");
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleRegister() {
    setLoading(true);
    const res = await registerPartnerAction({
      businessName, contactName, phone, email, nationalId, address,
      logoUrl, bio, shebaNumber: sheba, cardNumber: card, password,
      categoryIds: selectedCategories, termsAccepted,
    });
    setLoading(false);
    if (res?.error) return toast.error(res.error);
    toast.success("ثبت‌نام با موفقیت انجام شد. پس از تأیید ادمین می‌توانید وارد شوید.");
    setMode("login");
  }

  async function handleForgotRequest() {
    setLoading(true);
    const res = await requestPasswordResetAction(forgotPhone);
    setLoading(false);
    if (res?.error) return toast.error(res.error);
    toast.success("کد بازیابی پیامک شد.");
    setForgotStep("confirm");
  }

  async function handleForgotConfirm() {
    setLoading(true);
    const res = await confirmPasswordResetAction(forgotPhone, forgotCode, forgotNewPassword);
    setLoading(false);
    if (res?.error) return toast.error(res.error);
    toast.success("رمز عبور تغییر کرد. حالا وارد شوید.");
    setMode("login");
    setForgotStep("request");
  }

  return (
    <div className="partner-card" style={{ maxWidth: mode === "register" ? 640 : 400, width: "100%" }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 18 }}>پنل همکاران سبزفراز</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setMode("login")} className="partner-btn" style={{ flex: 1, background: mode === "login" ? "#16a34a" : "#f3f4f6", color: mode === "login" ? "#fff" : "#374151" }}>ورود</button>
        {registrationOpen && (
          <button onClick={() => setMode("register")} className="partner-btn" style={{ flex: 1, background: mode === "register" ? "#16a34a" : "#f3f4f6", color: mode === "register" ? "#fff" : "#374151" }}>ثبت‌نام همکار جدید</button>
        )}
      </div>

      {mode === "login" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="partner-input" placeholder="شماره موبایل" dir="ltr" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} />
          <input className="partner-input" type="password" placeholder="رمز عبور" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
          <button onClick={handleLogin} disabled={loading} className="partner-btn partner-btn-primary">{loading ? "در حال ورود..." : "ورود"}</button>
          <button onClick={() => setMode("forgot")} style={{ fontSize: 12.5, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>رمز عبور را فراموش کرده‌ام</button>
        </div>
      )}

      {mode === "forgot" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {forgotStep === "request" ? (
            <>
              <input className="partner-input" placeholder="شماره موبایل" dir="ltr" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} />
              <button onClick={handleForgotRequest} disabled={loading} className="partner-btn partner-btn-primary">{loading ? "در حال ارسال..." : "ارسال کد بازیابی"}</button>
            </>
          ) : (
            <>
              <input className="partner-input" placeholder="کد پیامک‌شده" dir="ltr" value={forgotCode} onChange={(e) => setForgotCode(e.target.value)} />
              <input className="partner-input" type="password" placeholder="رمز عبور جدید" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} />
              <button onClick={handleForgotConfirm} disabled={loading} className="partner-btn partner-btn-primary">{loading ? "در حال ثبت..." : "تغییر رمز عبور"}</button>
            </>
          )}
          <button onClick={() => setMode("login")} style={{ fontSize: 12.5, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>بازگشت به ورود</button>
        </div>
      )}

      {mode === "register" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="partner-input" placeholder="نام فروشگاه / نام و نام‌خانوادگی *" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          <input className="partner-input" placeholder="نام مسئول تماس (اختیاری)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="partner-input" placeholder="شماره موبایل *" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="partner-input" placeholder="ایمیل (اختیاری)" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <input className="partner-input" placeholder="کد ملی / شناسه کسب‌وکار *" dir="ltr" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          <textarea className="partner-input" placeholder="آدرس کامل *" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="partner-input" placeholder="شماره شبا *" dir="ltr" value={sheba} onChange={(e) => setSheba(e.target.value)} />
            <input className="partner-input" placeholder="شماره کارت (اختیاری)" dir="ltr" value={card} onChange={(e) => setCard(e.target.value)} />
          </div>
          <input className="partner-input" type="password" placeholder="رمز عبور *" value={password} onChange={(e) => setPassword(e.target.value)} />
          <textarea className="partner-input" placeholder="توضیح درباره فروشگاه (اختیاری)" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} />

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>لوگوی فروشگاه (اختیاری)</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoUrl && <img src={logoUrl} alt="لوگو" style={{ width: 50, height: 50, borderRadius: 8, marginTop: 6, objectFit: "cover" }} />}
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>دسته‌بندی‌های مورد علاقه</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {categories.map((c) => (
                <button key={c.id} type="button" onClick={() => toggleCategory(c.id)} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, border: "none", cursor: "pointer", background: selectedCategories.includes(c.id) ? "#16a34a" : "#f3f4f6", color: selectedCategories.includes(c.id) ? "#fff" : "#374151" }}>
                  {c.name}
                </button>
              ))}
              {categories.length === 0 && <span style={{ fontSize: 12, color: "#9ca3af" }}>دسته‌بندی مجازی برای همکاران هنوز تعیین نشده.</span>}
            </div>
          </div>

          <div style={{ background: "#f9fafb", borderRadius: 8, padding: 10, fontSize: 11.5, color: "#4b5563", maxHeight: 120, overflowY: "auto", whiteSpace: "pre-line" }}>
            {termsText}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
            قوانین همکاری را می‌پذیرم
          </label>

          <button onClick={handleRegister} disabled={loading || !termsAccepted} className="partner-btn partner-btn-primary">
            {loading ? "در حال ثبت..." : "ثبت‌نام"}
          </button>
        </div>
      )}
    </div>
  );
}