"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Upload, Loader2 } from "lucide-react";
import { updateHomepagePartnerFeatureAction } from "@/app/admin/partners/settings/actions";

interface PartnerOption { id: string; business_name: string; phone: string }

export default function FeaturedPartnerForm({
  initialEnabled,
  initialPartnerId,
  initialStoreImageUrl,
  initialStoreName,
  initialDescription,
  initialShowProducts,
  partners,
}: {
  initialEnabled: boolean;
  initialPartnerId: string | null;
  initialStoreImageUrl: string | null;
  initialStoreName: string | null;
  initialDescription: string | null;
  initialShowProducts: boolean;
  partners: PartnerOption[];
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [partnerId, setPartnerId] = useState(initialPartnerId ?? "");
  const [storeImageUrl, setStoreImageUrl] = useState(initialStoreImageUrl);
  const [storeName, setStoreName] = useState(initialStoreName ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [showProducts, setShowProducts] = useState(initialShowProducts);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setStoreImageUrl(data.url);
      else toast.error(data.error || "خطا در آپلود");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSave() {
    setSaving(true);
    const res = await updateHomepagePartnerFeatureAction({
      enabled,
      partnerId: partnerId || null,
      storeImageUrl,
      storeName: storeName || null,
      description: description || null,
      showProducts,
    });
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success("تنظیمات همکار ویژه ذخیره شد.");
  }

  return (
    <div className="admin-card" style={{ maxWidth: 640 }}>
      <h2 style={{ fontWeight: 800, marginBottom: 12 }}>نمایش همکار ویژه در صفحه اصلی</h2>

      <label className="admin-switch" style={{ marginBottom: 14 }}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span className="admin-switch-track" />
        <span>نمایش این بخش در صفحه اصلی</span>
      </label>

      <label className="admin-form-group">
        <span>انتخاب همکار (بر اساس ثبت‌نام قبلی)</span>
        <select className="admin-input" value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
          <option value="">-- انتخاب کنید --</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.business_name} ({p.phone})</option>
          ))}
        </select>
      </label>

      <div className="admin-form-group">
        <span>تصویر فروشگاه / لوگو</span>
        {storeImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storeImageUrl} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, marginBottom: 8, display: "block" }} />
        )}
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer text-sm text-gray-500 hover:border-green-500 hover:text-green-600 max-w-xs">
          {uploading ? (<><Loader2 size={16} className="animate-spin" /> در حال آپلود...</>) : (<><Upload size={16} /> {storeImageUrl ? "تغییر تصویر" : "آپلود تصویر"}</>)}
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
      </div>

      <label className="admin-form-group">
        <span>اسم فروشگاه (نمایشی)</span>
        <input className="admin-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="مثلاً فروشگاه الکترونیک پارس" />
      </label>

      <label className="admin-form-group">
        <span>توضیحات (داخل آکاردئون به کاربر نشان داده می‌شود)</span>
        <textarea className="admin-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label className="admin-switch" style={{ margin: "10px 0" }}>
        <input type="checkbox" checked={showProducts} onChange={(e) => setShowProducts(e.target.checked)} />
        <span className="admin-switch-track" />
        <span>نمایش محصولات این همکار (دو ردیف ۱۰تایی)</span>
      </label>

      <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ذخیره..." : "ذخیره تنظیمات همکار ویژه"}
      </button>
    </div>
  );
}