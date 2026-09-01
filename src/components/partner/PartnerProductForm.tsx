"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Wand2, X, Plus, GripVertical } from "lucide-react";
import ImageFrameEditor from "./ImageFrameEditor";
import PartnerCategorySelect from "./PartnerCategorySelect";
import ProductAttributesEditor, { type AttributeRow } from "@/components/admin/ProductAttributesEditor";
import CategoryMultiSelect from "@/components/admin/CategoryMultiSelect";
import type { PartnerCategoryOption } from "@/types/partner";
import {
  autofillProductWithAiAction, createPartnerProductAction, updatePartnerProductAction,
} from "@/app/partner/products/actions";

const NAMED_COLORS = [
  { name: "مشکی", hex: "#111827" }, { name: "سفید", hex: "#ffffff" }, { name: "طوسی روشن", hex: "#d1d5db" },
  { name: "طوسی تیره", hex: "#4b5563" }, { name: "قرمز", hex: "#dc2626" }, { name: "قرمز تیره", hex: "#991b1b" },
  { name: "صورتی", hex: "#ec4899" }, { name: "نارنجی", hex: "#f97316" }, { name: "زرد", hex: "#eab308" },
  { name: "طلایی", hex: "#d4af37" }, { name: "سبز روشن", hex: "#4ade80" }, { name: "سبز", hex: "#16a34a" },
  { name: "سبز تیره", hex: "#166534" }, { name: "فیروزه‌ای", hex: "#14b8a6" }, { name: "آبی روشن", hex: "#38bdf8" },
  { name: "آبی", hex: "#2563eb" }, { name: "آبی تیره", hex: "#1e3a8a" }, { name: "سرمه‌ای", hex: "#0f172a" },
  { name: "بنفش", hex: "#8b5cf6" }, { name: "بنفش تیره", hex: "#5b21b6" }, { name: "قهوه‌ای", hex: "#78350f" },
  { name: "کرم", hex: "#fef3c7" }, { name: "نقره‌ای", hex: "#c0c0c0" }, { name: "بژ", hex: "#e7d7c1" },
];

interface FrameConfig { frameUrl: string; centerX: number; centerY: number; centerWidth: number; centerHeight: number; outputSize: number; }
interface ImageEntry { finalUrl: string; rawCropUrl: string; alt: string; }

export default function PartnerProductForm({
  mode, product, categories, frameConfig,
}: {
  mode: "create" | "edit";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
product?: any;
  categories: PartnerCategoryOption[];
  frameConfig: FrameConfig | null;
}) {
  const router = useRouter();

  // اطلاعات اولیه
  const [title, setTitle] = useState(product?.name ?? "");
  const [nameEn, setNameEn] = useState(product?.name_en ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [shortDescription, setShortDescription] = useState(product?.short_description ?? "");
  const [tagsInput, setTagsInput] = useState((product?.tags ?? []).join("، "));

  // دسته‌بندی
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [extraCategoryIds, setExtraCategoryIds] = useState<string[]>(product?.extraCategoryIds ?? []);
  const [suggestingNewCategory, setSuggestingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // قیمت و موجودی
  const [sellPrice, setSellPrice] = useState(product?.price?.toString() ?? "");
  const [discountSellPrice, setDiscountSellPrice] = useState(product?.discount_price?.toString() ?? "");
  const [partnerCostPrice, setPartnerCostPrice] = useState(product?.partner_cost_price?.toString() ?? "");
  const [stock, setStock] = useState(product?.stock?.toString() ?? "");
  const [stockUnlimited, setStockUnlimited] = useState(product?.partner_stock_unlimited ?? false);
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [weightGrams, setWeightGrams] = useState(product?.weight_grams?.toString() ?? "");

  // فروش واحدی / حداقل سفارش
  const [isSoldByUnit, setIsSoldByUnit] = useState(product?.is_sold_by_unit ?? false);
  const [unitLabel, setUnitLabel] = useState(product?.unit_label ?? "متر");
  const [hasMinOrderQty, setHasMinOrderQty] = useState(product?.has_min_order_quantity ?? false);
  const [minOrderQuantity, setMinOrderQuantity] = useState(product?.min_order_quantity?.toString() ?? "");

  // تخفیف پلکانی
  const [tiers, setTiers] = useState<{ id: string; minQty: string; maxQty: string; unitPrice: string }[]>(
   (product?.quantityTiers ?? []).map((t: { id?: string; min_qty?: number | string; max_qty?: number | string; unit_price?: number | string }) => ({ id: t.id ?? crypto.randomUUID(), minQty: String(t.min_qty ?? ""), maxQty: String(t.max_qty ?? ""), unitPrice: String(t.unit_price ?? "") }))
  );

  // سئو
  const [metaTitle, setMetaTitle] = useState(product?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.meta_description ?? "");
  const [focusKeyword, setFocusKeyword] = useState(product?.focus_keyword ?? "");

  // رنگ و سایز
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(product?.colors ?? []);
  const [colorChoice, setColorChoice] = useState("0");
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#2175f5");
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [sizeInput, setSizeInput] = useState("");

  // مشخصات فنی
  const [attributes, setAttributes] = useState<AttributeRow[]>(product?.attributes ?? []);

  // نمایش
  const [showInNewest, setShowInNewest] = useState(product?.show_in_newest ?? true);
  const [isPopular, setIsPopular] = useState(product?.is_popular ?? false);
  const [isStock, setIsStock] = useState(product?.is_stock ?? false);
  const [showInFeed, setShowInFeed] = useState(product?.show_in_feed ?? true);
  const [reviewsEnabled, setReviewsEnabled] = useState(product?.reviews_enabled ?? true);
  const [displayPriority, setDisplayPriority] = useState(product?.display_priority?.toString() ?? "0");
  const [maxPurchaseQty, setMaxPurchaseQty] = useState(product?.max_purchase_qty?.toString() ?? "");

  // بسته‌بندی
  const [packageLength, setPackageLength] = useState(product?.package_length_cm?.toString() ?? "");
  const [packageWidth, setPackageWidth] = useState(product?.package_width_cm?.toString() ?? "");
  const [packageHeight, setPackageHeight] = useState(product?.package_height_cm?.toString() ?? "");
  const [gtin, setGtin] = useState(product?.gtin ?? "");
  const [modelVersion, setModelVersion] = useState(product?.model_version ?? "");

  // سفارش از چین
  const [fulfillmentType, setFulfillmentType] = useState<"INSTANT" | "CHINA_ORDER" | "BOTH">(product?.fulfillment_type ?? "INSTANT");
  const [chinaPrice, setChinaPrice] = useState(product?.china_price?.toString() ?? "");
  const [chinaDeliveryMin, setChinaDeliveryMin] = useState(product?.china_delivery_min?.toString() ?? "");
  const [chinaDeliveryMax, setChinaDeliveryMax] = useState(product?.china_delivery_max?.toString() ?? "");
  const [chinaDeliveryUnit, setChinaDeliveryUnit] = useState<"day" | "week" | "month">(product?.china_delivery_unit ?? "day");
  const [chinaTermsText, setChinaTermsText] = useState(product?.china_terms_text ?? "");
  const [chinaDeliveryText, setChinaDeliveryText] = useState(product?.china_delivery_text ?? "");
  const [chinaOrderNote, setChinaOrderNote] = useState(product?.china_order_note ?? "");

  // تصاویر (با قاب اختصاصی)
  const [images, setImages] = useState<ImageEntry[]>(
    (product?.images ?? []).map((url: string) => ({ finalUrl: url, rawCropUrl: "", alt: "" }))
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // پرکردن خودکار AI
  const [autofilling, setAutofilling] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAutofill() {
    if (title.trim().length < 3) return toast.error("ابتدا یک عنوان مختصر و مفید بنویسید (مثلاً «چسب حرارتی ۱۰ میل»).");
    setAutofilling(true);
    try {
      const res = await autofillProductWithAiAction(title);
      setAutofilling(false);
      if (res.error) return toast.error(res.error);
      setDescription(res.description ?? "");
      setShortDescription(res.short_description ?? "");
      setTagsInput((res.tags ?? []).join("، "));
      setMetaTitle(res.meta_title ?? "");
      setMetaDescription(res.meta_description ?? "");
      setFocusKeyword(res.focus_keyword ?? "");
      if (res.suggested_category) {
        const match = categories.find((c) => c.name === res.suggested_category);
        if (match) setCategoryId(match.id);
      }
      toast.success("فیلدها با هوش مصنوعی پر شد — می‌توانید ویرایش کنید.");
    } catch {
      setAutofilling(false);
      toast.error("مشکلی پیش آمده، لطفاً دوباره تلاش کنید.");
    }
  }

  async function handleImageComposited(finalBlob: Blob, rawCropBlob: Blob) {
    const { uploadPartnerProductImageAction } = await import("@/app/partner/products/actions");
    const finalFd = new FormData();
    finalFd.append("file", new File([finalBlob], "product.webp", { type: "image/webp" }));
    const finalRes = await uploadPartnerProductImageAction(finalFd);
    if (!finalRes.url) return toast.error(finalRes.error ?? "خطا در آپلود تصویر");

    const rawFd = new FormData();
    rawFd.append("file", new File([rawCropBlob], "raw.webp", { type: "image/webp" }));
    const rawRes = await uploadPartnerProductImageAction(rawFd);

    setImages((prev) => [...prev, { finalUrl: finalRes.url!, rawCropUrl: rawRes.url ?? "", alt: "" }]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }
  function updateImageAlt(index: number, alt: string) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, alt } : img)));
  }
  function handleImageDragStart(index: number) { setDraggedIndex(index); }
  function handleImageDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDraggedIndex(index);
  }
  function handleImageDragEnd() { setDraggedIndex(null); }

  function addColor() {
    let newColor: { name: string; hex: string };
    if (colorChoice === "custom") {
      if (!customColorName.trim()) return;
      newColor = { name: customColorName.trim(), hex: customColorHex };
    } else {
      const preset = NAMED_COLORS[Number(colorChoice)];
      if (!preset) return;
      newColor = preset;
    }
    if (colors.some((c) => c.name === newColor.name)) return;
    setColors((prev) => [...prev, newColor]);
    setCustomColorName("");
  }
  function removeColor(index: number) { setColors((prev) => prev.filter((_, i) => i !== index)); }

  function addSize() {
    const v = sizeInput.trim();
    if (!v || sizes.includes(v)) return;
    setSizes((prev) => [...prev, v]);
    setSizeInput("");
  }
  function removeSize(index: number) { setSizes((prev) => prev.filter((_, i) => i !== index)); }

  function addTier() { setTiers((prev) => [...prev, { id: crypto.randomUUID(), minQty: "", maxQty: "", unitPrice: "" }]); }
  function updateTier(id: string, field: "minQty" | "maxQty" | "unitPrice", value: string) {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }
  function removeTier(id: string) { setTiers((prev) => prev.filter((t) => t.id !== id)); }

  const profit = (Number(sellPrice) || 0) - (Number(partnerCostPrice) || 0);
  const profitPercent = Number(sellPrice) > 0 ? (profit / Number(sellPrice)) * 100 : 0;

  async function handleSubmit() {
    if (!title.trim() || title.trim().length < 3) return toast.error("عنوان محصول باید حداقل ۳ کاراکتر باشد.");
    if (!categoryId && !suggestingNewCategory) return toast.error("دسته‌بندی را انتخاب کنید یا دسته‌ی جدید پیشنهاد دهید.");
    if (suggestingNewCategory && !newCategoryName.trim()) return toast.error("نام دسته‌بندی پیشنهادی را بنویسید.");
    if (images.length === 0) return toast.error("حداقل یک تصویر محصول لازم است.");
    if (!sellPrice || !partnerCostPrice) return toast.error("قیمت فروش و قیمت دریافتی شما الزامی است.");
    if (!stockUnlimited && !stock) return toast.error("موجودی را وارد کنید یا گزینه‌ی نامحدود را انتخاب کنید.");

    const payload = {
      title, nameEn: nameEn || null, description, shortDescription: shortDescription || null,
      tags: tagsInput.split(/[،,]/).map((t: string) => t.trim()).filter(Boolean),
      categoryId: categoryId || null, extraCategoryIds,
      suggestedCategoryName: suggestingNewCategory ? newCategoryName.trim() : null,
      sellPrice: Number(sellPrice), discountSellPrice: discountSellPrice ? Number(discountSellPrice) : null,
      partnerCostPrice: Number(partnerCostPrice),
      stock: Number(stock) || 0, stockUnlimited, brand: brand || null,
      weightGrams: weightGrams ? Number(weightGrams) : null,
      isSoldByUnit, unitLabel: isSoldByUnit ? unitLabel : null,
      hasMinOrderQty, minOrderQuantity: hasMinOrderQty && minOrderQuantity ? Number(minOrderQuantity) : null,
      quantityTiers: tiers.filter((t: { minQty: string; maxQty: string; unitPrice: string }) => t.minQty && t.maxQty && t.unitPrice).map((t: { minQty: string; maxQty: string; unitPrice: string }) => ({ minQty: Number(t.minQty), maxQty: Number(t.maxQty), unitPrice: Number(t.unitPrice) })),
      metaTitle: metaTitle || null, metaDescription: metaDescription || null, focusKeyword: focusKeyword || null,
      colors, sizes,
      attributes: attributes.filter((a) => a.key.trim() && a.value.trim()).map((a) => ({ key: a.key.trim(), value: a.value.trim() })),
      showInNewest, isPopular, isStock, showInFeed, reviewsEnabled,
      displayPriority: Number(displayPriority) || 0, maxPurchaseQty: maxPurchaseQty ? Number(maxPurchaseQty) : null,
      packageLengthCm: packageLength ? Number(packageLength) : null, packageWidthCm: packageWidth ? Number(packageWidth) : null, packageHeightCm: packageHeight ? Number(packageHeight) : null,
      gtin: gtin || null, modelVersion: modelVersion || null,
      fulfillmentType, chinaPrice: chinaPrice ? Number(chinaPrice) : null,
      chinaDeliveryMin: chinaDeliveryMin ? Number(chinaDeliveryMin) : null, chinaDeliveryMax: chinaDeliveryMax ? Number(chinaDeliveryMax) : null,
      chinaDeliveryUnit, chinaTermsText: chinaTermsText || null, chinaDeliveryText: chinaDeliveryText || null, chinaOrderNote: chinaOrderNote || null,
      images: images.map((i) => i.finalUrl), imageAltTexts: images.map((i) => i.alt),
      imageSources: images.filter((i) => i.rawCropUrl).map((i) => ({ finalUrl: i.finalUrl, rawCropUrl: i.rawCropUrl })),
      aiAutofilled: false,
    };

    setSaving(true);
    try {
      const res = mode === "edit" && product ? await updatePartnerProductAction(product.id, payload) : await createPartnerProductAction(payload);
      setSaving(false);
      if (res?.error) return toast.error(res.error);
      toast.success(mode === "edit" ? "تغییرات ذخیره و برای بررسی مجدد ارسال شد." : "محصول ثبت شد و برای بررسی مدیر ارسال شد.");
      router.push("/partner/products");
    } catch (e: unknown) {
      setSaving(false);
      const message = e instanceof Error ? e.message : "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.";
      toast.error(message);
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* اطلاعات اولیه */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>اطلاعات اولیه</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>عنوان محصول</label>
              <input className="partner-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder='مثلاً: "چسب حرارتی ۱۰ میل" یا "مقاومت ۱۰ اهم ۲ وات"' style={{ width: "100%" }} />
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>فقط کافیه عنوان مختصر و مفید بنویسید تا هوش مصنوعی متوجه بشه — بقیه‌ی موارد رو خودش پیشنهاد می‌ده و شما می‌تونید ویرایش کنید.</p>
            </div>
            <button type="button" onClick={handleAutofill} disabled={autofilling || title.trim().length < 3} className="partner-btn partner-btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
              <Wand2 size={14} /> {autofilling ? "لطفاً منتظر بمانید…" : "پر کردن خودکار با هوش مصنوعی"}
            </button>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>نام محصول (انگلیسی — اختیاری)</label>
              <input className="partner-input" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="مثلاً: Hot Glue Stick 10mm" style={{ width: "100%" }} />
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>توضیحات کامل محصول</label>
              <textarea className="partner-input" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: "100%" }} />
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>توضیح کوتاه (برای لیست محصولات)</label>
              <textarea className="partner-input" rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} style={{ width: "100%" }} />
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 6 }}>برچسب‌ها (با ویرگول جدا کنید)</label>
              <input className="partner-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>
        </div>

        {/* دسته‌بندی */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>دسته‌بندی</h2>
          {!suggestingNewCategory ? (
            <>
              <PartnerCategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
              {categoryId && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>دسته‌بندی‌های فرعی اضافه (اختیاری)</label>
                   {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <CategoryMultiSelect categories={categories as any} excludeId={categoryId} selectedIds={extraCategoryIds} onChange={setExtraCategoryIds} />
                </div>
              )}
              <button type="button" onClick={() => setSuggestingNewCategory(true)} style={{ fontSize: 12, color: "#16a34a", background: "none", border: "none", cursor: "pointer", marginTop: 10 }}>
                دسته‌بندی موردنظرم توی لیست نیست — پیشنهاد دسته جدید بدم
              </button>
            </>
          ) : (
            <div>
              <input className="partner-input" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="نام دسته‌بندی پیشنهادی" style={{ width: "100%", marginBottom: 8 }} />
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>این پیشنهاد برای بررسی نزد مدیر فرستاده می‌شود؛ تا تأیید و ساخته‌شدنش، محصول شما بدون دسته‌بندی نهایی در صف بررسی می‌ماند.</p>
              <button type="button" onClick={() => { setSuggestingNewCategory(false); setNewCategoryName(""); }} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
                انصراف — انتخاب از لیست موجود
              </button>
            </div>
          )}
        </div>

        {/* قیمت و موجودی */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>قیمت و موجودی</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>قیمت فروش به مشتری (تومان)</label>
              <input className="partner-input" type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} style={{ width: "100%" }} />
              <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 3 }}>همان مبلغی که مشتری در سایت پرداخت می‌کند.</p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>قیمت بعد از تخفیف (اختیاری)</label>
              <input className="partner-input" type="number" value={discountSellPrice} onChange={(e) => setDiscountSellPrice(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>قیمتی که شما دریافت می‌کنید (تومان)</label>
              <input className="partner-input" type="number" value={partnerCostPrice} onChange={(e) => setPartnerCostPrice(e.target.value)} style={{ width: "100%" }} />
              <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 3 }}>مبلغی که بابت فروش این محصول به کیف پول شما واریز می‌شود.</p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>وزن هر واحد (گرم — برای هزینه ارسال)</label>
              <input className="partner-input" type="number" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>
          {Number(sellPrice) > 0 && Number(partnerCostPrice) > 0 && (
            <p style={{ fontSize: 11.5, marginTop: 8, color: profitPercent >= 0 ? "#16a34a" : "#dc2626" }}>
              سود سایت از این محصول: {profit.toLocaleString("fa-IR")} تومان ({profitPercent.toFixed(1)}٪)
            </p>
          )}

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 8 }}>
              <input type="checkbox" checked={stockUnlimited} onChange={(e) => setStockUnlimited(e.target.checked)} /> موجودی نامحدود
            </label>
            {!stockUnlimited && <input className="partner-input" type="number" placeholder="تعداد موجودی" value={stock} onChange={(e) => setStock(e.target.value)} style={{ width: 200 }} />}
            <p style={{ fontSize: 10.5, color: "#b45309", marginTop: 6 }}>لطفاً فقط موجودی واقعی و مطمئن را وارد کنید. در صورت لغو سفارش به دلیل نبود کالا، جریمه اعمال می‌شود.</p>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>برند (اختیاری)</label>
            <input className="partner-input" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ width: 260 }} />
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <input type="checkbox" checked={isSoldByUnit} onChange={(e) => setIsSoldByUnit(e.target.checked)} /> فروش بر اساس واحد سفارشی (متری/کیلویی)
            </label>
            {isSoldByUnit && <input className="partner-input" placeholder="عنوان واحد (مثلاً: متر)" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} style={{ width: 220 }} />}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <input type="checkbox" checked={hasMinOrderQty} onChange={(e) => setHasMinOrderQty(e.target.checked)} /> حداقل تعداد/مقدار خرید الزامی است
            </label>
            {hasMinOrderQty && <input className="partner-input" type="number" step="0.1" placeholder="حداقل مقدار" value={minOrderQuantity} onChange={(e) => setMinOrderQuantity(e.target.value)} style={{ width: 220 }} />}
          </div>
        </div>

        {/* تخفیف پلکانی */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>تخفیف پلکانی بر اساس تعداد (اختیاری)</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {tiers.map((t) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
                <input className="partner-input" type="number" placeholder="از" value={t.minQty} onChange={(e) => updateTier(t.id, "minQty", e.target.value)} />
                <input className="partner-input" type="number" placeholder="تا" value={t.maxQty} onChange={(e) => updateTier(t.id, "maxQty", e.target.value)} />
                <input className="partner-input" type="number" placeholder="قیمت واحد" value={t.unitPrice} onChange={(e) => updateTier(t.id, "unitPrice", e.target.value)} />
                <button type="button" onClick={() => removeTier(t.id)} className="partner-btn" style={{ background: "#fee2e2", color: "#dc2626" }}><X size={13} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addTier} className="partner-btn partner-btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={13} /> افزودن بازه تعداد</button>
        </div>

        {/* تصاویر با قاب اختصاصی */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 4 }}>تصاویر محصول (در قاب اختصاصی سبزفراز)</h2>
          {!frameConfig?.frameUrl && (
            <p style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: 10, borderRadius: 8, marginBottom: 10 }}>
              قالب تصویر هنوز توسط مدیر سایت تنظیم نشده است. تا وقتی این قالب تنظیم نشه، امکان افزودن عکس (و در نتیجه ثبت محصول) وجود نداره — لطفاً با پشتیبانی سبزفراز هماهنگ کنید.
            </p>
          )}
          {frameConfig?.frameUrl && <ImageFrameEditor config={frameConfig} onComposited={handleImageComposited} />}

          {images.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px,1fr))", gap: 10, marginTop: 14 }}>
              {images.map((img, i) => (
                <div key={i} className="image-drag-item" draggable onDragStart={() => handleImageDragStart(i)} onDragOver={(e) => handleImageDragOver(e, i)} onDragEnd={handleImageDragEnd} style={{ position: "relative" }}>
                  <span className="image-drag-handle"><GripVertical size={12} /></span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.finalUrl} alt="" style={{ width: "100%", aspectRatio: "1", borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }} />
                  <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, left: -6, background: "#dc2626", color: "#fff", borderRadius: "50%", width: 20, height: 20, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={11} /></button>
                  <input value={img.alt} onChange={(e) => updateImageAlt(i, e.target.value)} placeholder="متن جایگزین" style={{ width: "100%", fontSize: 10, marginTop: 4, padding: "3px 5px", border: "1px solid #e5e7eb", borderRadius: 6 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* رنگ و سایز */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>رنگ‌های موجود (اختیاری)</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {colors.map((c, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "#f3f4f6", borderRadius: 999, padding: "4px 10px", fontSize: 11.5 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.hex, border: "1px solid #d1d5db" }} /> {c.name}
                <button type="button" onClick={() => removeColor(i)}><X size={11} /></button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={colorChoice} onChange={(e) => setColorChoice(e.target.value)} className="partner-input" style={{ flex: 1 }}>
              {NAMED_COLORS.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
              <option value="custom">رنگ سفارشی...</option>
            </select>
            <button type="button" onClick={addColor} className="partner-btn partner-btn-secondary"><Plus size={14} /></button>
          </div>
          {colorChoice === "custom" && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input type="color" value={customColorHex} onChange={(e) => setCustomColorHex(e.target.value)} />
              <input className="partner-input" placeholder="نام رنگ" value={customColorName} onChange={(e) => setCustomColorName(e.target.value)} style={{ flex: 1 }} />
            </div>
          )}

          <h2 style={{ fontWeight: 800, marginTop: 20, marginBottom: 12 }}>سایزهای موجود (اختیاری)</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {sizes.map((s, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "#f3f4f6", borderRadius: 999, padding: "4px 10px", fontSize: 11.5 }}>{s}<button type="button" onClick={() => removeSize(i)}><X size={11} /></button></span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="partner-input" placeholder="مثلاً: 42 یا M" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }} style={{ flex: 1 }} />
            <button type="button" onClick={addSize} className="partner-btn partner-btn-secondary"><Plus size={14} /></button>
          </div>
        </div>

        {/* مشخصات فنی */}
        <div className="partner-card">
          <ProductAttributesEditor attributes={attributes} onChange={setAttributes} />
        </div>

        {/* سئو */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>سئو</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>عنوان سئو (حداکثر ۶۰ کاراکتر)</label>
              <input className="partner-input" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value.slice(0, 60))} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>توضیحات متا (حداکثر ۱۶۰ کاراکتر)</label>
              <textarea className="partner-input" rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>کلمه کلیدی کانونی (اختیاری)</label>
              <input className="partner-input" value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>
        </div>

        {/* نمایش و تنظیمات بیشتر */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>نمایش و تنظیمات بیشتر</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><input type="checkbox" checked={showInNewest} onChange={(e) => setShowInNewest(e.target.checked)} /> نمایش در «جدیدترین محصولات» (پس از تأیید)</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} /> نمایش در «محصولات پرطرفدار» (پیشنهادی — تأیید نهایی با مدیر است)</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><input type="checkbox" checked={isStock} onChange={(e) => setIsStock(e.target.checked)} /> نمایش در «محصولات استوک»</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><input type="checkbox" checked={showInFeed} onChange={(e) => setShowInFeed(e.target.checked)} /> نمایش در فید گوگل/ترب</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><input type="checkbox" checked={reviewsEnabled} onChange={(e) => setReviewsEnabled(e.target.checked)} /> امکان ثبت نظر برای این محصول فعال باشد</label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>اولویت نمایش (اختیاری)</label><input className="partner-input" type="number" value={displayPriority} onChange={(e) => setDisplayPriority(e.target.value)} style={{ width: "100%" }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>حداکثر تعداد مجاز خرید هر سفارش</label><input className="partner-input" type="number" value={maxPurchaseQty} onChange={(e) => setMaxPurchaseQty(e.target.value)} style={{ width: "100%" }} /></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>ابعاد بسته‌بندی (سانتی‌متر — برای هزینه پست دقیق‌تر)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <input className="partner-input" type="number" placeholder="طول" value={packageLength} onChange={(e) => setPackageLength(e.target.value)} />
              <input className="partner-input" type="number" placeholder="عرض" value={packageWidth} onChange={(e) => setPackageWidth(e.target.value)} />
              <input className="partner-input" type="number" placeholder="ارتفاع" value={packageHeight} onChange={(e) => setPackageHeight(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>بارکد / GTIN (اختیاری)</label><input className="partner-input" dir="ltr" value={gtin} onChange={(e) => setGtin(e.target.value)} style={{ width: "100%" }} /></div>
            <div><label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>مدل / نسخه (اختیاری)</label><input className="partner-input" value={modelVersion} onChange={(e) => setModelVersion(e.target.value)} style={{ width: "100%" }} /></div>
          </div>
        </div>

        {/* روش تأمین / سفارش از چین */}
        <div className="partner-card">
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>روش تأمین</h2>
          <select className="partner-input" value={fulfillmentType} onChange={(e) => setFulfillmentType(e.target.value as "INSTANT" | "CHINA_ORDER" | "BOTH")} style={{ width: "100%" }}>
            <option value="INSTANT">فقط موجود / فوری</option>
            <option value="CHINA_ORDER">فقط سفارش از چین</option>
            <option value="BOTH">هر دو (موجود و سفارش از چین)</option>
          </select>
          {(fulfillmentType === "CHINA_ORDER" || fulfillmentType === "BOTH") && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <input className="partner-input" type="number" placeholder="قیمت سفارش از چین" value={chinaPrice} onChange={(e) => setChinaPrice(e.target.value)} />
                <input className="partner-input" type="number" placeholder="حداقل زمان تحویل" value={chinaDeliveryMin} onChange={(e) => setChinaDeliveryMin(e.target.value)} />
                <input className="partner-input" type="number" placeholder="حداکثر زمان تحویل" value={chinaDeliveryMax} onChange={(e) => setChinaDeliveryMax(e.target.value)} />
              </div>
              <select className="partner-input" value={chinaDeliveryUnit} onChange={(e) => setChinaDeliveryUnit(e.target.value as "day" | "week" | "month")}>
                <option value="day">روز</option><option value="week">هفته</option><option value="month">ماه</option>
              </select>
              <textarea className="partner-input" placeholder="متن قوانین سفارش از چین" value={chinaTermsText} onChange={(e) => setChinaTermsText(e.target.value)} />
              <input className="partner-input" placeholder="متن زمان تحویل (اختیاری)" value={chinaDeliveryText} onChange={(e) => setChinaDeliveryText(e.target.value)} />
              <textarea className="partner-input" rows={2} placeholder="توضیحات سفارش مدت‌دار برای فاکتور" value={chinaOrderNote} onChange={(e) => setChinaOrderNote(e.target.value)} />
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={saving} className="partner-btn partner-btn-primary" style={{ alignSelf: "flex-start", padding: "12px 32px", fontSize: 14 }}>
          {saving ? "در حال ذخیره..." : mode === "edit" ? "ذخیره تغییرات" : "ثبت محصول"}
        </button>
      </div>
    </div>
  );
}