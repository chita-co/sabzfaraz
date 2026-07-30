"use client";

import { useState } from "react";
import Image from "next/image"; // ← اضافه شد
import { Upload, Loader2, X } from "lucide-react";
import { updateSiteAssets } from "@/app/admin/site-settings/actions";

function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) onChange(data.url);
      else alert(data.error || "خطا در آپلود");
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="admin-form-group">
      <label>{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      {value && (
        <div className="relative mb-2 h-20" style={{ width: 180 }}>
          <Image
            src={value}
            alt=""
            fill
            className="object-cover border rounded-lg bg-gray-50 p-1"
            sizes="180px"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer text-sm text-gray-500 hover:border-green-500 hover:text-green-600 max-w-xs">
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> در حال آپلود...
          </>
        ) : (
          <>
            <Upload size={16} /> {value ? "تغییر تصویر" : "آپلود تصویر"}
          </>
        )}
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
      </label>
    </div>
  );
}

export default function SiteAssetsManager({
  initialLogo,
  initialDealsBannerImage,
  initialDealsBannerLink,
  initialNewProductsBannerImage,
  initialNewProductsBannerLink,
}: {
  initialLogo: string | null;
  initialDealsBannerImage: string | null;
  initialDealsBannerLink: string | null;
  initialNewProductsBannerImage: string | null;
  initialNewProductsBannerLink: string | null;
}) {
  const [logo, setLogo] = useState(initialLogo);
  const [dealsImg, setDealsImg] = useState(initialDealsBannerImage);
  const [dealsLink, setDealsLink] = useState(initialDealsBannerLink ?? "");
  const [newImg, setNewImg] = useState(initialNewProductsBannerImage);
  const [newLink, setNewLink] = useState(initialNewProductsBannerLink ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateSiteAssets({
      logoUrl: logo,
      dealsBannerImage: dealsImg,
      dealsBannerLink: dealsLink,
      newProductsBannerImage: newImg,
      newProductsBannerLink: newLink,
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">تنظیمات سایت</h1>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">لوگو</h2>
        <ImageField
          label="لوگوی سایت"
          value={logo}
          onChange={setLogo}
          hint="در هدر سایت، صفحه پرداخت موفق و فاکتور نمایش داده می‌شود."
        />
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">بنر تبلیغاتی جشنواره تخفیف</h2>
        <ImageField
          label="تصویر بنر"
          value={dealsImg}
          onChange={setDealsImg}
          hint="بعد از ردیف دسته‌بندی‌ها و قبل از لیست محصولات جشنواره نمایش داده می‌شود."
        />
        <div className="admin-form-group">
          <label>لینک مقصد (اختیاری)</label>
          <input type="text" value={dealsLink} onChange={(e) => setDealsLink(e.target.value)} placeholder="/deals" />
        </div>
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">بنر تبلیغاتی محصولات جدید</h2>
        <ImageField
          label="تصویر بنر"
          value={newImg}
          onChange={setNewImg}
          hint="قبل از لیست جدیدترین محصولات نمایش داده می‌شود."
        />
        <div className="admin-form-group">
          <label>لینک مقصد (اختیاری)</label>
          <input type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="/#products" />
        </div>
      </div>

      {saved && <p className="text-green-600 text-sm">تغییرات ذخیره شد.</p>}
      <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ذخیره..." : "ذخیره همه تغییرات"}
      </button>
    </div>
  );
}