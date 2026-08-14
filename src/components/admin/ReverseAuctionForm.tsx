"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { createReverseAuction, updateReverseAuction } from "@/app/admin/reverse-auctions/actions";

interface CategoryLite { id: string; name: string; }
interface ProductLite { id: string; name: string; }
interface ReverseAuctionRow {
  id: string; title: string; description: string; images: string[]; category_id: string | null; product_id: string | null;
  starting_price: number; floor_price: number; drop_amount: number; drop_interval_minutes: number;
  shipping_cost: number; starts_at: string; ends_at: string | null; rules_text: string | null;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReverseAuctionForm({
  mode, auction, categories, products,
}: { mode: "create" | "edit"; auction?: ReverseAuctionRow; categories: CategoryLite[]; products: ProductLite[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(auction?.title ?? "");
  const [description, setDescription] = useState(auction?.description ?? "");
  const [images, setImages] = useState<string[]>(auction?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState(auction?.category_id ?? "");
  const [productId, setProductId] = useState(auction?.product_id ?? "");
  const [startingPrice, setStartingPrice] = useState(auction?.starting_price?.toString() ?? "");
  const [floorPrice, setFloorPrice] = useState(auction?.floor_price?.toString() ?? "");
  const [dropAmount, setDropAmount] = useState(auction?.drop_amount?.toString() ?? "10000");
  const [dropIntervalMinutes, setDropIntervalMinutes] = useState(auction?.drop_interval_minutes?.toString() ?? "30");
  const [shippingCost, setShippingCost] = useState(auction?.shipping_cost?.toString() ?? "0");
  const [startsAt, setStartsAt] = useState(auction ? toLocalInput(auction.starts_at) : "");
  const [endsAt, setEndsAt] = useState(auction?.ends_at ? toLocalInput(auction.ends_at) : "");
  const [rulesText, setRulesText] = useState(auction?.rules_text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) setImages((prev) => [...prev, data.url]);
      } catch {}
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !startingPrice || !floorPrice || !startsAt || images.length === 0) {
      setError("عنوان، قیمت شروع، کف قیمت، زمان شروع و حداقل یک تصویر الزامی است.");
      return;
    }
    if (Number(floorPrice) > Number(startingPrice)) {
      setError("کف قیمت نمی‌تواند بیشتر از قیمت شروع باشد.");
      return;
    }
    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("زمان پایان باید بعد از زمان شروع باشد.");
      return;
    }

    const input = {
      title, description, images, categoryId: categoryId || null, productId: productId || null,
      startingPrice: Number(startingPrice), floorPrice: Number(floorPrice),
      dropAmount: Number(dropAmount) || 1000, dropIntervalMinutes: Number(dropIntervalMinutes) || 30,
      shippingCost: Number(shippingCost) || 0,
      startsAt: new Date(startsAt).toISOString(), endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      rulesText,
    };

    setSaving(true);
    const result = mode === "edit" && auction ? await updateReverseAuction(auction.id, input) : await createReverseAuction(input);
    if (result?.error) { setError(result.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{mode === "edit" ? "ویرایش کالای حراج معکوس" : "کالای جدید برای حراج معکوس"}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="admin-form-group"><label>عنوان محصول</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="admin-form-group"><label>توضیحات کامل</label><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>

          <div className="admin-form-group">
            <label>تصاویر</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {images.map((url) => (
                <div key={url} className="relative h-24">
                  <Image src={url} alt="" fill className="object-cover rounded-lg border" sizes="150px" />
                  <button type="button" onClick={() => setImages((p) => p.filter((u) => u !== url))} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"><X size={12} /></button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer text-sm text-gray-500">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} افزودن تصویر
              <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={uploading} className="hidden" />
            </label>
          </div>

          <div className="admin-form-group"><label>دسته‌بندی (اختیاری)</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">بدون دسته‌بندی</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div className="admin-form-group"><label>اتصال به محصول واقعی (اختیاری)</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">بدون اتصال</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>

          <div className="admin-form-group"><label>قوانین این حراج (اختیاری)</label><textarea rows={3} value={rulesText} onChange={(e) => setRulesText(e.target.value)} /></div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group"><label>قیمت شروع (تومان)</label><input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} required min={0} /></div>
            <div className="admin-form-group"><label>کف قیمت — حداقل قیمت (تومان)</label><input type="number" value={floorPrice} onChange={(e) => setFloorPrice(e.target.value)} required min={0} /></div>
            <div className="admin-form-group"><label>مبلغ کاهش هر بار (تومان)</label><input type="number" value={dropAmount} onChange={(e) => setDropAmount(e.target.value)} min={1000} /></div>
            <div className="admin-form-group"><label>فاصله زمانی هر کاهش (دقیقه)</label><input type="number" value={dropIntervalMinutes} onChange={(e) => setDropIntervalMinutes(e.target.value)} min={1} /></div>
            <div className="admin-form-group"><label>هزینه ارسال (تومان)</label><input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group"><label>زمان شروع</label><input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required /></div>
            <div className="admin-form-group"><label>زمان پایان (اختیاری — اگر خالی بماند، تا فروش ادامه می‌یابد)</label><input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            پیش‌نمایش: قیمت هر {(Number(dropIntervalMinutes) || 30).toLocaleString("fa-IR")} دقیقه، {(Number(dropAmount) || 0).toLocaleString("fa-IR")} تومان کاهش می‌یابد تا به کف قیمت برسد.
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <div className="flex gap-3 mt-6">
        <button type="submit" disabled={saving || uploading} className="admin-btn admin-btn-primary">{saving ? "در حال ذخیره..." : "ذخیره"}</button>
        <button type="button" onClick={() => router.push("/admin/reverse-auctions")} className="admin-btn admin-btn-secondary">انصراف</button>
      </div>
    </form>
  );
}