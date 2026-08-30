"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Wand2, X } from "lucide-react";
import ImageFrameEditor from "./ImageFrameEditor";
import { autofillProductWithAiAction, createPartnerProductAction, uploadPartnerProductImageAction } from "@/app/partner/products/actions";

interface CategoryOption { id: string; name: string; }
interface FrameConfig { frameUrl: string; centerX: number; centerY: number; centerWidth: number; centerHeight: number; outputSize: number; }

export default function PartnerProductForm({ categories, frameConfig }: { categories: CategoryOption[]; frameConfig: FrameConfig | null }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [partnerCostPrice, setPartnerCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [stockUnlimited, setStockUnlimited] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageSources, setImageSources] = useState<{ finalUrl: string; rawCropUrl: string }[]>([]);
  const [aiAutofilled, setAiAutofilled] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [saving, setSaving] = useState(false);

  const profit = (Number(sellPrice) || 0) - (Number(partnerCostPrice) || 0);

  async function handleAutofill() {
    if (title.trim().length < 3) return toast.error("ابتدا عنوان محصول را دقیق‌تر بنویسید (مثلاً «مته ۲ میلی‌متر»).");
    setAutofilling(true);
    const res = await autofillProductWithAiAction(title);
    setAutofilling(false);
    if (res.error) return toast.error(res.error);
    setDescription(res.description ?? "");
    setShortDescription(res.short_description ?? "");
    setTags((res.tags ?? []).join(", "));
    setAiAutofilled(true);
    if (res.suggested_category) {
      const match = categories.find((c) => c.name === res.suggested_category);
      if (match) setCategoryId(match.id);
    }
    toast.success("فیلدها با هوش مصنوعی پر شد — می‌توانید ویرایش کنید.");
  }

  async function handleImageComposited(finalBlob: Blob, rawCropBlob: Blob) {
    const finalFd = new FormData();
    finalFd.append("file", new File([finalBlob], "product.webp", { type: "image/webp" }));
    const finalRes = await uploadPartnerProductImageAction(finalFd);
    if (!finalRes.url) return toast.error(finalRes.error ?? "خطا در آپلود تصویر");

    const rawFd = new FormData();
    rawFd.append("file", new File([rawCropBlob], "raw.webp", { type: "image/webp" }));
    const rawRes = await uploadPartnerProductImageAction(rawFd);

    setImages((prev) => [...prev, finalRes.url]);
    if (rawRes.url) setImageSources((prev) => [...prev, { finalUrl: finalRes.url, rawCropUrl: rawRes.url }]);
  }

  async function handleSubmit() {
    if (!frameConfig?.frameUrl) return toast.error("قالب تصویر هنوز توسط مدیر تنظیم نشده است. لطفاً بعداً تلاش کنید.");
    setSaving(true);
    const res = await createPartnerProductAction({
      title, description, shortDescription, categoryId,
      sellPrice: Number(sellPrice) || 0, partnerCostPrice: Number(partnerCostPrice) || 0,
      stock: Number(stock) || 0, stockUnlimited, images, imageSources,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      aiAutofilled,
    });
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success("محصول ثبت شد و برای بررسی مدیر ارسال شد.");
    router.push("/partner/products");
  }

  return (
    <div className="partner-card" style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>عنوان محصول</label>
        <input className="partner-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder='مثلاً: "مته ۲ میلی‌متر" یا "چسب حرارتی ۱۰ میلی‌متر"' />
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>عنوان را دقیق و کوتاه بنویسید تا هوش مصنوعی بهتر بفهمد.</p>
      </div>

      <button type="button" onClick={handleAutofill} disabled={autofilling || title.trim().length < 3} className="partner-btn partner-btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
        <Wand2 size={14} /> {autofilling ? "لطفاً منتظر بمانید…" : "پر کردن خودکار با هوش مصنوعی"}
      </button>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>خلاصه کوتاه</label>
        <input className="partner-input" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>توضیحات کامل</label>
        <textarea className="partner-input" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>برچسب‌ها (با کاما جدا کنید)</label>
        <input className="partner-input" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>دسته‌بندی</label>
        <select className="partner-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">انتخاب کنید</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>قیمت فروش به مشتری (تومان)</label>
          <input className="partner-input" type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
          <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 3 }}>همان مبلغی که مشتری در سایت پرداخت می‌کند.</p>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>قیمتی که شما دریافت می‌کنید (تومان)</label>
          <input className="partner-input" type="number" value={partnerCostPrice} onChange={(e) => setPartnerCostPrice(e.target.value)} />
          <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 3 }}>مبلغی که بابت فروش این محصول به شما پرداخت می‌شود.</p>
        </div>
      </div>
      {Number(sellPrice) > 0 && Number(partnerCostPrice) > 0 && (
        <p style={{ fontSize: 11.5, color: profit > 0 ? "#16a34a" : "#dc2626" }}>سود سایت از این محصول: {profit.toLocaleString("fa-IR")} تومان</p>
      )}

      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 8 }}>
          <input type="checkbox" checked={stockUnlimited} onChange={(e) => setStockUnlimited(e.target.checked)} /> موجودی نامحدود
        </label>
        {!stockUnlimited && (
          <input className="partner-input" type="number" placeholder="تعداد موجودی" value={stock} onChange={(e) => setStock(e.target.value)} />
        )}
        <p style={{ fontSize: 10.5, color: "#b45309", marginTop: 4 }}>لطفاً فقط موجودی واقعی و مطمئن را وارد کنید. در صورت لغو سفارش به دلیل نبود کالا، جریمه اعمال می‌شود.</p>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>تصاویر محصول (در قاب اختصاصی سبزفراز)</label>
        {frameConfig?.frameUrl ? (
          <ImageFrameEditor config={frameConfig} onComposited={handleImageComposited} />
        ) : (
          <p style={{ fontSize: 12, color: "#dc2626" }}>قالب تصویر هنوز توسط مدیر تنظیم نشده است.</p>
        )}
        {images.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" style={{ width: 70, height: 70, borderRadius: 8, objectFit: "cover" }} />
                <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: -6, left: -6, background: "#dc2626", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={saving} className="partner-btn partner-btn-primary" style={{ alignSelf: "flex-start", padding: "10px 26px" }}>
        {saving ? "در حال ثبت..." : "ثبت محصول"}
      </button>
    </div>
  );
}