"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { updatePartnerInfoAction } from "@/app/admin/partners/[id]/actions";
import type { Partner } from "@/types/partner";

export default function PartnerInfoEditForm({ partner }: { partner: Partner }) {
  const [businessName, setBusinessName] = useState(partner.business_name);
  const [contactName, setContactName] = useState(partner.contact_name ?? "");
  const [phone, setPhone] = useState(partner.phone);
  const [email, setEmail] = useState(partner.email ?? "");
  const [nationalId, setNationalId] = useState(partner.national_id ?? "");
  const [address, setAddress] = useState(partner.address);
  const [bio, setBio] = useState(partner.bio ?? "");
  const [sheba, setSheba] = useState(partner.sheba_number ?? "");
  const [card, setCard] = useState(partner.card_number ?? "");
  const [logoUrl, setLogoUrl] = useState(partner.logo_url);
  const [maxProducts, setMaxProducts] = useState(partner.max_active_products?.toString() ?? "");
  const [maxOrders, setMaxOrders] = useState(partner.max_active_orders?.toString() ?? "");
  const [aiLimit, setAiLimit] = useState(partner.ai_daily_request_limit?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await updatePartnerInfoAction(partner.id, {
      businessName, contactName, phone, email, nationalId, address, bio,
      shebaNumber: sheba, cardNumber: card, logoUrl,
      maxActiveProducts: maxProducts ? Number(maxProducts) : null,
      maxActiveOrders: maxOrders ? Number(maxOrders) : null,
      aiDailyRequestLimit: aiLimit ? Number(aiLimit) : null,
    });
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success("اطلاعات همکار ذخیره شد.");
  }

  return (
    <div className="admin-card">
      <h2 style={{ fontWeight: 800, marginBottom: 14 }}>اطلاعات ثبت‌نام (کامل و قابل‌ویرایش)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label className="admin-form-group"><span>نام فروشگاه</span><input className="admin-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></label>
        <label className="admin-form-group"><span>نام مسئول تماس</span><input className="admin-input" value={contactName} onChange={(e) => setContactName(e.target.value)} /></label>
        <label className="admin-form-group"><span>شماره موبایل (نام کاربری ورود)</span><input className="admin-input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <label className="admin-form-group"><span>ایمیل</span><input className="admin-input" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="admin-form-group"><span>کد ملی / شناسه کسب‌وکار</span><input className="admin-input" value={nationalId} onChange={(e) => setNationalId(e.target.value)} /></label>
        <label className="admin-form-group"><span>شماره شبا</span><input className="admin-input" dir="ltr" value={sheba} onChange={(e) => setSheba(e.target.value)} /></label>
        <label className="admin-form-group"><span>شماره کارت</span><input className="admin-input" dir="ltr" value={card} onChange={(e) => setCard(e.target.value)} /></label>
        <label className="admin-form-group"><span>لینک لوگو</span><input className="admin-input" dir="ltr" value={logoUrl ?? ""} onChange={(e) => setLogoUrl(e.target.value)} /></label>
        <label className="admin-form-group" style={{ gridColumn: "span 2" }}><span>آدرس کامل</span><textarea className="admin-input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        <label className="admin-form-group" style={{ gridColumn: "span 2" }}><span>توضیح درباره فروشگاه</span><textarea className="admin-input" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
        <label className="admin-form-group"><span>سقف محصولات فعال (خالی = بی‌سقف)</span><input className="admin-input" type="number" value={maxProducts} onChange={(e) => setMaxProducts(e.target.value)} /></label>
        <label className="admin-form-group"><span>سقف سفارش‌های فعال (خالی = بی‌سقف)</span><input className="admin-input" type="number" value={maxOrders} onChange={(e) => setMaxOrders(e.target.value)} /></label>
        <label className="admin-form-group"><span>سقف روزانه پرکردن خودکار AI (خالی = بی‌سقف)</span><input className="admin-input" type="number" value={aiLimit} onChange={(e) => setAiLimit(e.target.value)} /></label>
      </div>
      <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>تاریخ ثبت‌نام: {new Date(partner.created_at).toLocaleDateString("fa-IR")}{partner.approved_at ? ` — تاریخ تأیید: ${new Date(partner.approved_at).toLocaleDateString("fa-IR")}` : ""}</p>
      <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary" style={{ marginTop: 14 }}>{saving ? "در حال ذخیره..." : "ذخیره اطلاعات همکار"}</button>
    </div>
  );
}