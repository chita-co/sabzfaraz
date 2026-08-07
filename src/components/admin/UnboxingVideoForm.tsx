"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUnboxingVideo } from "@/app/admin/unboxing/actions";

interface ProductLite { id: string; name: string; }

export default function UnboxingVideoForm({ products }: { products: ProductLite[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<"aparat" | "youtube">("aparat");
  const [videoInput, setVideoInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [productId, setProductId] = useState("");
  const [rewardAmount, setRewardAmount] = useState("200000");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredProducts = products.filter((p) => p.name.includes(productFilter));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createUnboxingVideo({
      title, platform, videoInput,
      customerName: customerName || null,
      orderNumber: orderNumber || null,
      productId: productId || null,
      rewardAmount: Number(rewardAmount) || 200000,
    });
    setSaving(false);
    if (result?.error) setError(result.error);
    else router.push("/admin/unboxing");
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 520 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-6">افزودن ویدیوی آنباکس</h1>

      <div className="admin-form-group">
        <label>عنوان ویدیو</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: آنباکس آردوینو Uno" required />
      </div>

      <div className="admin-form-group">
        <label>پلتفرم</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value as "aparat" | "youtube")}>
          <option value="aparat">آپارات</option>
          <option value="youtube">یوتیوب</option>
        </select>
      </div>

      <div className="admin-form-group">
        <label>لینک یا شناسه ویدیو</label>
        <input type="text" dir="ltr" value={videoInput} onChange={(e) => setVideoInput(e.target.value)} placeholder="لینک کامل یا فقط شناسه ویدیو" required />
      </div>

      <div className="admin-form-group">
        <label>نام مشتری (اختیاری)</label>
        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
      </div>

      <div className="admin-form-group">
        <label>شماره سفارش (اختیاری — برای اتصال خودکار به کاربر و پاداش)</label>
        <input type="text" dir="ltr" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="مثلاً: SF1785789004218" />
      </div>

      <div className="admin-form-group">
        <label>محصول مرتبط (اختیاری — برای نمایش در صفحه محصول)</label>
        <input type="text" placeholder="جستجوی محصول..." value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="admin-input mb-2 w-full" />
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">بدون اتصال به محصول خاص</option>
          {filteredProducts.slice(0, 50).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="admin-form-group">
        <label>مبلغ پاداش (تومان)</label>
        <input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} min={0} />
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ثبت..." : "ثبت ویدیو (در انتظار تأیید)"}
      </button>
    </form>
  );
}