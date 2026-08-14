"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { createAuction, updateAuction } from "@/app/admin/auctions/actions";

interface CategoryLite { id: string; name: string; }
interface ProductLite { id: string; name: string; }
interface AuctionRow {
  id: string; title: string; description: string; images: string[]; category_id: string | null; product_id: string | null;
  base_price: number; min_increment: number; reserve_price: number | null; max_price: number | null;
  entry_fee: number; entry_fee_refundable: boolean; max_participants: number | null; max_bids_per_user: number | null;
  shipping_cost: number; starts_at: string; ends_at: string; auto_extend_enabled: boolean;
  auto_extend_trigger_minutes: number; auto_extend_by_minutes: number; max_extensions: number | null;
  rules_text: string | null; bots_enabled: boolean; final_payment_hours: number; is_sealed?: boolean;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AuctionForm({
  mode, auction, categories, products,
}: { mode: "create" | "edit"; auction?: AuctionRow; categories: CategoryLite[]; products: ProductLite[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(auction?.title ?? "");
  const [description, setDescription] = useState(auction?.description ?? "");
  const [images, setImages] = useState<string[]>(auction?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState(auction?.category_id ?? "");
  const [productId, setProductId] = useState(auction?.product_id ?? "");
  const [basePrice, setBasePrice] = useState(auction?.base_price?.toString() ?? "");
  const [minIncrement, setMinIncrement] = useState(auction?.min_increment?.toString() ?? "10000");
  const [reservePrice, setReservePrice] = useState(auction?.reserve_price?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(auction?.max_price?.toString() ?? "");
  const [entryFee, setEntryFee] = useState(auction?.entry_fee?.toString() ?? "0");
  const [entryFeeRefundable, setEntryFeeRefundable] = useState(auction?.entry_fee_refundable ?? false);
  const [maxParticipants, setMaxParticipants] = useState(auction?.max_participants?.toString() ?? "");
  const [maxBidsPerUser, setMaxBidsPerUser] = useState(auction?.max_bids_per_user?.toString() ?? "");
  const [shippingCost, setShippingCost] = useState(auction?.shipping_cost?.toString() ?? "0");
  const [startsAt, setStartsAt] = useState(auction ? toLocalInput(auction.starts_at) : "");
  const [endsAt, setEndsAt] = useState(auction ? toLocalInput(auction.ends_at) : "");
  const [autoExtendEnabled, setAutoExtendEnabled] = useState(auction?.auto_extend_enabled ?? true);
  const [autoExtendTrigger, setAutoExtendTrigger] = useState(auction?.auto_extend_trigger_minutes?.toString() ?? "2");
  const [autoExtendBy, setAutoExtendBy] = useState(auction?.auto_extend_by_minutes?.toString() ?? "5");
  const [maxExtensions, setMaxExtensions] = useState(auction?.max_extensions?.toString() ?? "");
  const [rulesText, setRulesText] = useState(auction?.rules_text ?? "");
  const [botsEnabled, setBotsEnabled] = useState(auction?.bots_enabled ?? false);
  const [isSealed, setIsSealed] = useState(auction?.is_sealed ?? false);
  const [finalPaymentHours, setFinalPaymentHours] = useState(auction?.final_payment_hours?.toString() ?? "24");
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
    if (!title || !basePrice || !startsAt || !endsAt || images.length === 0) {
      setError("عنوان، قیمت پایه، زمان شروع/پایان و حداقل یک تصویر الزامی است.");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("زمان پایان باید بعد از زمان شروع باشد.");
      return;
    }

    const input = {
      title, description, images,
      categoryId: categoryId || null, productId: productId || null,
      basePrice: Number(basePrice), minIncrement: Number(minIncrement) || 1000,
      reservePrice: reservePrice ? Number(reservePrice) : null, maxPrice: maxPrice ? Number(maxPrice) : null,
      entryFee: Number(entryFee) || 0, entryFeeRefundable,
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      maxBidsPerUser: maxBidsPerUser ? Number(maxBidsPerUser) : null,
      shippingCost: Number(shippingCost) || 0,
      startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(),
      autoExtendEnabled, autoExtendTriggerMinutes: Number(autoExtendTrigger) || 2, autoExtendByMinutes: Number(autoExtendBy) || 5,
      maxExtensions: maxExtensions ? Number(maxExtensions) : null,
      rulesText, botsEnabled, finalPaymentHours: Number(finalPaymentHours) || 24, isSealed,
    };

    setSaving(true);
    const result = mode === "edit" && auction ? await updateAuction(auction.id, input) : await createAuction(input);
    if (result?.error) { setError(result.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{mode === "edit" ? "ویرایش مزایده" : "مزایده جدید"}</h1>

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
          <div className="admin-form-group"><label>اتصال به محصول واقعی (اختیاری — برای ساخت خودکار سفارش پس از پرداخت نهایی)</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">بدون اتصال</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group"><label>زمان شروع</label><input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required /></div>
            <div className="admin-form-group"><label>زمان پایان</label><input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required /></div>
          </div>

          <div className="admin-form-group"><label>قوانین اختصاصی این مزایده</label><textarea rows={3} value={rulesText} onChange={(e) => setRulesText(e.target.value)} /></div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group"><label>قیمت پایه (تومان)</label><input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required min={0} /></div>
            <div className="admin-form-group"><label>حداقل افزایش (تومان)</label><input type="number" value={minIncrement} onChange={(e) => setMinIncrement(e.target.value)} min={1000} /></div>
            <div className="admin-form-group"><label>قیمت رزرو (مخفی، اختیاری)</label><input type="number" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} /></div>
            <div className="admin-form-group"><label>سقف قیمت (اختیاری)</label><input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /></div>
            <div className="admin-form-group"><label>هزینه شرکت (تومان)</label><input type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} min={0} /></div>
            <div className="admin-form-group"><label>هزینه ارسال (تومان)</label><input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} /></div>
            <div className="admin-form-group"><label>حداکثر شرکت‌کننده (اختیاری)</label><input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} /></div>
            <div className="admin-form-group"><label>حداکثر پیشنهاد هر کاربر (اختیاری)</label><input type="number" value={maxBidsPerUser} onChange={(e) => setMaxBidsPerUser(e.target.value)} /></div>
          </div>

          <div className="admin-form-group flex items-center gap-2">
            <input type="checkbox" id="entryFeeRefundable" checked={entryFeeRefundable} onChange={(e) => setEntryFeeRefundable(e.target.checked)} />
            <label htmlFor="entryFeeRefundable" style={{ marginBottom: 0 }}>هزینه شرکت در صورت عدم برنده شدن بازگردانده شود</label>
          </div>

          <div className="admin-form-group flex items-center gap-2">
            <input type="checkbox" id="autoExtendEnabled" checked={autoExtendEnabled} onChange={(e) => setAutoExtendEnabled(e.target.checked)} />
            <label htmlFor="autoExtendEnabled" style={{ marginBottom: 0 }}>تمدید خودکار در پیشنهادهای لحظه آخر</label>
          </div>
          {autoExtendEnabled && (
            <div className="grid grid-cols-3 gap-2">
              <div className="admin-form-group"><label>X (دقیقه پایانی)</label><input type="number" value={autoExtendTrigger} onChange={(e) => setAutoExtendTrigger(e.target.value)} /></div>
              <div className="admin-form-group"><label>Y (دقیقه تمدید)</label><input type="number" value={autoExtendBy} onChange={(e) => setAutoExtendBy(e.target.value)} /></div>
              <div className="admin-form-group"><label>حداکثر تعداد تمدید</label><input type="number" value={maxExtensions} onChange={(e) => setMaxExtensions(e.target.value)} placeholder="نامحدود" /></div>
            </div>
          )}

          <div className="admin-form-group"><label>مهلت پرداخت نهایی برنده (ساعت)</label><input type="number" value={finalPaymentHours} onChange={(e) => setFinalPaymentHours(e.target.value)} /></div>

          <div className="admin-form-group flex items-center gap-2">
            <input type="checkbox" id="botsEnabled" checked={botsEnabled} onChange={(e) => setBotsEnabled(e.target.checked)} />
            <label htmlFor="botsEnabled" style={{ marginBottom: 0 }}>فعال بودن ربات‌های پیشنهاددهنده برای این مزایده</label>
          </div>
          <div className="admin-form-group flex items-center gap-2">
  <input type="checkbox" id="isSealed" checked={isSealed} onChange={(e) => setIsSealed(e.target.checked)} />
  <label htmlFor="isSealed" style={{ marginBottom: 0 }}>مزایده از نوع پیشنهاد مخفی باشد (Sealed Bid — پیشنهادها تا پایان مزایده مخفی می‌مانند)</label>
</div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <div className="flex gap-3 mt-6">
        <button type="submit" disabled={saving || uploading} className="admin-btn admin-btn-primary">{saving ? "در حال ذخیره..." : "ذخیره مزایده"}</button>
        <button type="button" onClick={() => router.push("/admin/auctions")} className="admin-btn admin-btn-secondary">انصراف</button>
      </div>
    </form>
  );
}