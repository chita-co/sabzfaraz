"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Upload, Trash2, Loader2, Save } from "lucide-react";
import { createPromoAd, togglePromoAdActive, deletePromoAd, updatePromoAd } from "@/app/admin/promo-ads/actions";
import { PromoAd } from "@/types";

function EditableRow({ ad }: { ad: PromoAd }) {
  const [title, setTitle] = useState(ad.title ?? "");
  const [description, setDescription] = useState(ad.description ?? "");
  const [linkUrl, setLinkUrl] = useState(ad.link_url ?? "");
  const [sortOrder, setSortOrder] = useState(String(ad.sort_order));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await updatePromoAd(ad.id, { title, description, linkUrl, sortOrder: Number(sortOrder) || 0 });
    setSaving(false);
    if (res.error) toast.error(res.error); else toast.success("ذخیره شد.");
  }

  async function handleDelete() {
    if (!confirm("آیا از حذف این باکس تبلیغاتی مطمئن هستید؟")) return;
    setDeleting(true);
    await deletePromoAd(ad.id, ad.image_url);
    setDeleting(false);
  }

  return (
    <tr>
      <td><Image src={ad.image_url} alt="" width={90} height={60} sizes="90px" className="object-cover rounded-lg" unoptimized /></td>
      <td><input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="تیتر (اختیاری)" /></td>
      <td><input className="admin-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیح کوتاه (اختیاری)" /></td>
      <td><input className="admin-input" dir="ltr" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/category/..." /></td>
      <td><input className="admin-input" type="number" style={{ width: 70 }} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></td>
      <td>
        <button className={ad.is_active ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-secondary"} onClick={() => togglePromoAdActive(ad.id, !ad.is_active)}>
          {ad.is_active ? "فعال" : "غیرفعال"}
        </button>
      </td>
      <td style={{ display: "flex", gap: 6 }}>
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving} title="ذخیره متن‌ها"><Save size={14} /></button>
        <button className="admin-btn admin-btn-danger" onClick={handleDelete} disabled={deleting}><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}

export default function PromoAdsManager({ promoAds }: { promoAds: PromoAd[] }) {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        await createPromoAd({ imageUrl: data.url, title, description, linkUrl, sortOrder: Number(sortOrder) || 0 });
        setTitle(""); setDescription(""); setLinkUrl("");
      } else {
        toast.error(data.error || "خطا در آپلود");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">باکس‌های تبلیغاتی صفحه اصلی (قبل از جشنواره تخفیف — حداکثر ۴ باکس فعال نمایش داده می‌شود)</h1>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">افزودن باکس جدید</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input className="admin-input" placeholder="تیتر (اختیاری)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="admin-input" placeholder="توضیح کوتاه (اختیاری)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="admin-input" dir="ltr" placeholder="لینک مقصد (اختیاری) مثلاً /category/modules" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <input className="admin-input" type="number" placeholder="ترتیب نمایش" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer text-sm text-gray-500 hover:border-green-500 hover:text-green-600">
          {uploading ? (<><Loader2 size={16} className="animate-spin" /> در حال آپلود...</>) : (<><Upload size={16} /> انتخاب تصویر (بعد از انتخاب تصویر، باکس ساخته می‌شود)</>)}
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>تصویر</th><th>تیتر</th><th>توضیح</th><th>لینک</th><th>ترتیب</th><th>وضعیت</th><th></th></tr>
          </thead>
          <tbody>
            {promoAds.map((ad) => <EditableRow key={ad.id} ad={ad} />)}
          </tbody>
        </table>
        {promoAds.length === 0 && <p className="text-gray-500 text-sm text-center py-6">هنوز باکسی ثبت نشده.</p>}
      </div>
    </div>
  );
}