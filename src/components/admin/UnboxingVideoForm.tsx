"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUnboxingVideo } from "@/app/admin/unboxing/actions";

interface ProductLite { id: string; name: string; }

export default function UnboxingVideoForm({ products }: { products: ProductLite[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [aparatInput, setAparatInput] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
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
      title, aparatInput, youtubeInput, instagramUrl,
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
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 560 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-6">افزودن ویدیوی آنباکس</h1>

      <div className="admin-form-group">
        <label>عنوان ویدیو</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: آنباکس آردوینو Uno" required />
      </div>

      <p className="text-xs text-gray-500 mb-2">
        حداقل یکی از سه لینک زیر الزامی است — پیشنهاد می‌شود ویدیو را روی هر سه پلتفرم آپلود کنید تا کاربران با هر نوع اینترنتی بتوانند آن را ببینند.
      </p>

      <div className="admin-form-group">
        <label>لینک یا شناسه ویدیو در آپارات (اولویت اول برای کاربران داخل ایران)</label>
        <input type="text" dir="ltr" value={aparatInput} onChange={(e) => setAparatInput(e.target.value)} placeholder="لینک embed یا شناسه ویدیو" />
      </div>

      <div className="admin-form-group">
        <label>لینک یا شناسه ویدیو در یوتیوب</label>
        <input type="text" dir="ltr" value={youtubeInput} onChange={(e) => setYoutubeInput(e.target.value)} placeholder="لینک کامل یا شناسه ویدیو" />
      </div>

      <div className="admin-form-group">
        <label>لینک پست/ریلز اینستاگرام</label>
        <input type="text" dir="ltr" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." />
      </div>

      <div className="admin-form-group">
        <label>نام مشتری (اختیاری)</label>
        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="مثلاً: علی محمدی" />
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