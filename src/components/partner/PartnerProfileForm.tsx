"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { updatePartnerProfileAction, changePartnerPasswordAction } from "@/app/partner/settings/actions";
import { uploadPartnerLogoAction } from "@/app/partner/products/actions";
import type { Partner } from "@/types/partner";

export default function PartnerProfileForm({ partner }: { partner: Partner }) {
  const [businessName, setBusinessName] = useState(partner.business_name);
  const [contactName, setContactName] = useState(partner.contact_name ?? "");
  const [address, setAddress] = useState(partner.address);
  const [bio, setBio] = useState(partner.bio ?? "");
  const [sheba, setSheba] = useState(partner.sheba_number ?? "");
  const [card, setCard] = useState(partner.card_number ?? "");
  const [logoUrl, setLogoUrl] = useState(partner.logo_url);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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

  async function handleSave() {
    setSaving(true);
    const res = await updatePartnerProfileAction({ businessName, contactName, address, bio, shebaNumber: sheba, cardNumber: card, logoUrl });
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success("اطلاعات پروفایل ذخیره شد.");
  }

  async function handleChangePassword() {
    if (!newPassword) return;
    setChangingPassword(true);
    const res = await changePartnerPasswordAction(newPassword);
    setChangingPassword(false);
    if (res.error) return toast.error(res.error);
    toast.success("رمز عبور تغییر کرد.");
    setNewPassword("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 480 }}>
      <div className="partner-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>لوگوی فروشگاه</label>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logoUrl && <img src={logoUrl} alt="لوگو" style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", marginBottom: 8 }} />}
          <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
        </div>

        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block" }}>
          نام فروشگاه
          <input className="partner-input" style={{ marginTop: 6 }} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </label>

        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block" }}>
          نام مسئول تماس
          <input className="partner-input" style={{ marginTop: 6 }} value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </label>

        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block" }}>
          آدرس
          <textarea className="partner-input" style={{ marginTop: 6 }} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>

        <label style={{ fontSize: 12.5, fontWeight: 700, display: "block" }}>
          توضیح درباره فروشگاه
          <textarea className="partner-input" style={{ marginTop: 6 }} rows={2} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", flex: 1 }}>
            شماره شبا
            <input className="partner-input" style={{ marginTop: 6 }} dir="ltr" value={sheba} onChange={(e) => setSheba(e.target.value)} />
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", flex: 1 }}>
            شماره کارت
            <input className="partner-input" style={{ marginTop: 6 }} dir="ltr" value={card} onChange={(e) => setCard(e.target.value)} />
          </label>
        </div>

        <button onClick={handleSave} disabled={saving} className="partner-btn partner-btn-primary" style={{ alignSelf: "flex-start" }}>
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>

      <div className="partner-card">
        <h2 style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>تغییر رمز عبور</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="partner-input" type="password" placeholder="رمز عبور جدید" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button onClick={handleChangePassword} disabled={changingPassword} className="partner-btn partner-btn-primary">تغییر</button>
        </div>
      </div>
    </div>
  );
}