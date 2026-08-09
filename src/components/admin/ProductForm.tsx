// src/components/admin/ProductForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, X, Upload, Loader2, Layers, GripVertical } from "lucide-react";
import { createProduct, updateProduct, createProductsBulk } from "@/app/admin/products/actions";
import { Category, Product, ProductColor, ProductQuantityTier } from "@/types";

const NAMED_COLORS: ProductColor[] = [
  { name: "مشکی", hex: "#111827" },
  { name: "سفید", hex: "#ffffff" },
  { name: "طوسی روشن", hex: "#d1d5db" },
  { name: "طوسی تیره", hex: "#4b5563" },
  { name: "قرمز", hex: "#dc2626" },
  { name: "قرمز تیره", hex: "#991b1b" },
  { name: "صورتی", hex: "#ec4899" },
  { name: "نارنجی", hex: "#f97316" },
  { name: "زرد", hex: "#eab308" },
  { name: "طلایی", hex: "#d4af37" },
  { name: "سبز روشن", hex: "#4ade80" },
  { name: "سبز", hex: "#16a34a" },
  { name: "سبز تیره", hex: "#166534" },
  { name: "فیروزه‌ای", hex: "#14b8a6" },
  { name: "آبی روشن", hex: "#38bdf8" },
  { name: "آبی", hex: "#2563eb" },
  { name: "آبی تیره", hex: "#1e3a8a" },
  { name: "سرمه‌ای", hex: "#0f172a" },
  { name: "بنفش", hex: "#8b5cf6" },
  { name: "بنفش تیره", hex: "#5b21b6" },
  { name: "قهوه‌ای", hex: "#78350f" },
  { name: "کرم", hex: "#fef3c7" },
  { name: "نقره‌ای", hex: "#c0c0c0" },
  { name: "بژ", hex: "#e7d7c1" },
];

interface VariantRow {
  id: string;
  name: string;
  nameEn: string;
  stock: string;
}

export default function ProductForm({
  mode,
  product,
  categories,
  initialQuantityTiers = [],
}: {
  mode: "create" | "edit";
  product?: Product;
  categories: Category[];
  initialQuantityTiers?: ProductQuantityTier[];
}) {
  const router = useRouter();

  const [bulkMode, setBulkMode] = useState(false);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([
    { id: crypto.randomUUID(), name: "", nameEn: "", stock: "" },
  ]);

  const [name, setName] = useState(product?.name ?? "");
  const [nameEn, setNameEn] = useState(product?.name_en ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [discountPrice, setDiscountPrice] = useState(
    product?.discount_price?.toString() ?? ""
  );
  const [stock, setStock] = useState(product?.stock?.toString() ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isDeal, setIsDeal] = useState(product?.is_deal ?? false);
  const [showInNewest, setShowInNewest] = useState(product?.show_in_newest ?? true);
  const [isPopular, setIsPopular] = useState(product?.is_popular ?? false);
  const [isStock, setIsStock] = useState(product?.is_stock ?? false);
  const [weightGrams, setWeightGrams] = useState(product?.weight_grams?.toString() ?? "");
  const [isSoldByUnit, setIsSoldByUnit] = useState(product?.is_sold_by_unit ?? false);
  const [unitLabel, setUnitLabel] = useState(product?.unit_label ?? "متر");

  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [descImages, setDescImages] = useState<string[]>(product?.description_images ?? []);
  const [descUploading, setDescUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [colors, setColors] = useState<ProductColor[]>(product?.colors ?? []);
  const [colorChoice, setColorChoice] = useState("0");
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#2175f5");

  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [sizeInput, setSizeInput] = useState("");

  const [tiers, setTiers] = useState(
    initialQuantityTiers.map((t) => ({
      id: t.id,
      minQty: t.min_qty.toString(),
      maxQty: t.max_qty.toString(),
      unitPrice: t.unit_price.toString(),
    }))
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function uploadOne(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) return data.url;
      alert(data.error || "خطا در آپلود تصویر");
      return null;
    } catch {
      alert("خطا در ارتباط با سرور برای آپلود تصویر");
      return null;
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const url = await uploadOne(file);
      if (url) setImages((prev) => [...prev, url]);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDescFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setDescUploading(true);
    for (const file of files) {
      const url = await uploadOne(file);
      if (url) setDescImages((prev) => [...prev, url]);
    }
    setDescUploading(false);
    e.target.value = "";
  }

  async function handleRemoveDescImage(url: string) {
    setDescImages((prev) => prev.filter((u) => u !== url));
    try { await fetch("/api/admin/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }); } catch {}
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

  async function handleRemoveImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
    try {
      await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      // best-effort
    }
  }



  function addColor() {
    let newColor: ProductColor;
    if (colorChoice === "custom") {
      if (!customName.trim()) return;
      newColor = { name: customName.trim(), hex: customHex };
    } else {
      const preset = NAMED_COLORS[Number(colorChoice)];
      if (!preset) return;
      newColor = preset;
    }
    if (colors.some((c) => c.name === newColor.name)) return;
    setColors((prev) => [...prev, newColor]);
    setCustomName("");
  }

  function removeColor(index: number) {
    setColors((prev) => prev.filter((_, i) => i !== index));
  }

  function addSize() {
    const v = sizeInput.trim();
    if (!v || sizes.includes(v)) return;
    setSizes((prev) => [...prev, v]);
    setSizeInput("");
  }

  function removeSize(index: number) {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  }

  function addTier() {
    setTiers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), minQty: "", maxQty: "", unitPrice: "" },
    ]);
  }

  function updateTier(id: string, field: "minQty" | "maxQty" | "unitPrice", value: string) {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function removeTier(id: string) {
    setTiers((prev) => prev.filter((t) => t.id !== id));
  }

  function addVariantRow() {
    setVariantRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", nameEn: "", stock: "" },
    ]);
  }

  function updateVariantRow(id: string, field: "name" | "nameEn" | "stock", value: string) {
    setVariantRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function removeVariantRow(id: string) {
    setVariantRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("انتخاب دسته‌بندی الزامی است.");
      return;
    }
    if (images.length === 0) {
      setError("حداقل یک تصویر برای محصول اضافه کنید.");
      return;
    }
    if (isDeal && !discountPrice) {
      setError("برای افزودن به جشنواره تخفیف، ابتدا قیمت تخفیف را وارد کنید.");
      return;
    }
    if (!price) {
      setError("قیمت پایه الزامی است.");
      return;
    }

    const parsedTiers = tiers
      .filter((t) => t.minQty && t.maxQty && t.unitPrice)
      .map((t) => ({
        minQty: Number(t.minQty),
        maxQty: Number(t.maxQty),
        unitPrice: Number(t.unitPrice),
      }));

    setSaving(true);

    if (bulkMode) {
      const validRows = variantRows.filter((r) => r.name.trim());
      if (validRows.length === 0) {
        setError("حداقل یک ردیف با نام معتبر وارد کنید.");
        setSaving(false);
        return;
      }
      const result = await createProductsBulk(
        {
          description,
          price: Number(price),
          discountPrice: discountPrice ? Number(discountPrice) : null,
          brand: brand || null,
          categoryId,
          isActive,
          isDeal,
          showInNewest,
          isPopular,
          isStock,
          weightGrams: weightGrams ? Number(weightGrams) : null,
          isSoldByUnit,
          unitLabel: isSoldByUnit ? unitLabel : null,
          images,
          descriptionImages: descImages,
          colors,
          sizes,
          quantityTiers: parsedTiers,
        },
        validRows.map((r) => ({
          name: r.name.trim(),
          nameEn: r.nameEn.trim() || null,
          stock: r.stock ? Number(r.stock) : null,
        }))
      );
      setSaving(false);
      if (result.failures && result.failures.length > 0) {
        alert(`${result.successCount.toLocaleString("fa-IR")} محصول با موفقیت ثبت شد.\n${result.failures.length.toLocaleString("fa-IR")} مورد خطا داشت:\n${result.failures.join("\n")}`);
      } else if (result.successCount > 0) {
        alert(`${result.successCount.toLocaleString("fa-IR")} محصول با موفقیت ثبت شد.`);
      }
      if (result.successCount > 0) router.push("/admin/products");
      return;
    }

    const input = {
      name,
      nameEn: nameEn || null,
      slug,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: stock ? Number(stock) : null,
      brand: brand || null,
      categoryId,
      isActive,
      isDeal,
      showInNewest,
      isPopular,
      isStock,
      weightGrams: weightGrams ? Number(weightGrams) : null,
      isSoldByUnit,
      unitLabel: isSoldByUnit ? unitLabel : null,
      images,
      descriptionImages: descImages,
      colors,
      sizes,
      quantityTiers: parsedTiers,
    };

    const result =
      mode === "edit" && product
        ? await updateProduct(product.id, input)
        : await createProduct(input);

    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {mode === "edit" ? "ویرایش محصول" : "افزودن محصول جدید"}
        </h1>
        {mode === "create" && (
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={bulkMode}
              onChange={(e) => setBulkMode(e.target.checked)}
            />
            <Layers size={15} /> افزودن گروهی چند مدل مشابه
          </label>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          {bulkMode ? (
            <div className="admin-form-group">
              <label>
                مدل‌ها (نام + موجودی هر مدل — بقیه اطلاعات از فرم سمت
                راست/پایین مشترک است)
              </label>
              <div className="space-y-2 mb-2">
                {variantRows.map((row) => (
                  <div key={row.id} className="variant-row-grid">
                    <input
                      type="text"
                      placeholder="نام فارسی (مثلاً: مقاومت 10 اهم)"
                      value={row.name}
                      onChange={(e) =>
                        updateVariantRow(row.id, "name", e.target.value)
                      }
                      className="admin-input"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="نام انگلیسی (اختیاری)"
                      value={row.nameEn}
                      onChange={(e) =>
                        updateVariantRow(row.id, "nameEn", e.target.value)
                      }
                      className="admin-input"
                    />
                    <input
                      type="number"
                      placeholder="موجودی"
                      value={row.stock}
                      onChange={(e) =>
                        updateVariantRow(row.id, "stock", e.target.value)
                      }
                      className="admin-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantRow(row.id)}
                      className="admin-btn admin-btn-danger"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="admin-btn admin-btn-secondary flex items-center gap-1"
              >
                <Plus size={14} /> افزودن ردیف مدل جدید
              </button>
              <p className="text-xs text-gray-400 mt-2">
                {variantRows.length.toLocaleString("fa-IR")} مدل آماده ثبت
              </p>
            </div>
          ) : (
            <>
              <div className="admin-form-group">
                <label>نام محصول (فارسی)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>
                  نام محصول (انگلیسی — اختیاری، زیر نام فارسی نمایش داده
                  می‌شود)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="مثلاً: HC-SR04 Ultrasonic Sensor"
                />
              </div>

              <div className="admin-form-group">
                <label>
                  اسلاگ (انگلیسی، اختیاری — خالی بگذارید تا خودکار ساخته شود)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="مثلاً: hc-sr04-sensor"
                />
              </div>

              <div className="admin-form-group">
                <label>موجودی (اختیاری — خالی = نامحدود)</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min={0}
                  placeholder="مثلاً: 10"
                />
              </div>
            </>
          )}

          <div className="admin-form-group">
            <label>
              توضیحات محصول (Enter برای پاراگراف‌بندی — مشترک بین همه مدل‌ها)
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="admin-form-group">
            <label>تصاویر داخل بخش «توضیحات محصول» (اختیاری — برای نمودار/جدول/راهنمای سیم‌کشی و...)</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {descImages.map((url) => (
                <div key={url} className="relative h-24">
                  <Image src={url} alt="" fill className="object-cover rounded-lg border border-gray-200" sizes="(max-width: 768px) 33vw, 150px" />
                  <button type="button" onClick={() => handleRemoveDescImage(url)} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"><X size={12} /></button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer text-sm text-gray-500 hover:border-green-500 hover:text-green-600">
              {descUploading ? <><Loader2 size={16} className="animate-spin" /> در حال آپلود...</> : <><Upload size={16} /> افزودن تصویر به توضیحات</>}
              <input type="file" accept="image/*" multiple onChange={handleDescFileChange} disabled={descUploading} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group">
              <label>قیمت پایه (تومان)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min={0}
              />
            </div>
            <div className="admin-form-group">
              <label>قیمت بعد از تخفیف (اختیاری)</label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group">
              <label>وزن هر واحد (گرم) — فقط برای هزینه ارسال</label>
              <input
                type="number"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                min={0}
                placeholder="مثلاً: 150"
              />
            </div>
            <div className="admin-form-group">
              <label>برند (اختیاری)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>دسته‌بندی</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">انتخاب کنید</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form-group flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActive" style={{ marginBottom: 0 }}>
              نمایش در فروشگاه (فعال)
            </label>
          </div>

          <div className="admin-form-group flex items-center gap-2">
            <input
              type="checkbox"
              id="showInNewest"
              checked={showInNewest}
              onChange={(e) => setShowInNewest(e.target.checked)}
            />
            <label htmlFor="showInNewest" style={{ marginBottom: 0 }}>
              نمایش در «جدیدترین محصولات»
            </label>
          </div>

          <div className="admin-form-group flex items-center gap-2">
            <input
              type="checkbox"
              id="isPopular"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
            />
            <label htmlFor="isPopular" style={{ marginBottom: 0 }}>
              نمایش در «محصولات پرطرفدار»
            </label>
          </div>

          <div className="admin-form-group flex items-center gap-2">
            <input
              type="checkbox"
              id="isStock"
              checked={isStock}
              onChange={(e) => setIsStock(e.target.checked)}
            />
            <label htmlFor="isStock" style={{ marginBottom: 0 }}>
              نمایش در «محصولات استوک»
            </label>
          </div>

          <div className="admin-form-group flex items-center gap-2">
            <input type="checkbox" id="isSoldByUnit" checked={isSoldByUnit} onChange={(e) => setIsSoldByUnit(e.target.checked)} />
            <label htmlFor="isSoldByUnit" style={{ marginBottom: 0 }}>فروش بر اساس واحد سفارشی (متری/کیلویی — مثل سیم لاکی)</label>
          </div>
          {isSoldByUnit && (
            <div className="admin-form-group">
              <label>عنوان واحد فروش (به‌جای «عدد» به مشتری نمایش داده می‌شود)</label>
              <input type="text" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="مثلاً: متر یا کیلوگرم" />
            </div>
          )}

          <div className="admin-form-group flex items-center gap-2">
            <input
              type="checkbox"
              id="isDeal"
              checked={isDeal}
              onChange={(e) => setIsDeal(e.target.checked)}
              disabled={!discountPrice}
            />
            <label htmlFor="isDeal" style={{ marginBottom: 0 }}>
              افزودن به جشنواره تخفیف{" "}
              {!discountPrice && "(ابتدا قیمت تخفیف را وارد کنید)"}
            </label>
          </div>
        </div>

        <div>
          <div className="admin-form-group">
            <label>تصاویر محصول (مشترک بین همه مدل‌ها)</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {images.map((url, i) => (
                <div
                  key={url}
                  className="relative h-24 image-drag-item"
                  draggable
                  onDragStart={() => handleImageDragStart(i)}
                  onDragOver={(e) => handleImageDragOver(e, i)}
                  onDragEnd={handleImageDragEnd}
                >
                  <span className="image-drag-handle"><GripVertical size={13} /></span>
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover rounded-lg border border-gray-200"
                    sizes="(max-width: 768px) 33vw, 150px"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer text-sm text-gray-500 hover:border-green-500 hover:text-green-600">
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> در حال آپلود...
                </>
              ) : (
                <>
                  <Upload size={16} /> افزودن تصویر
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="admin-form-group">
            <label>رنگ‌های موجود (اختیاری — اگر محصول رنگ ندارد، همین‌طور خالی بگذارید)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {colors.map((c, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border"
                    style={{ background: c.hex }}
                  />
                  {c.name}
                  <button type="button" onClick={() => removeColor(i)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={colorChoice}
                onChange={(e) => setColorChoice(e.target.value)}
                className="admin-input flex-1"
              >
                {NAMED_COLORS.map((c, i) => (
                  <option key={i} value={i}>
                    {c.name}
                  </option>
                ))}
                <option value="custom">رنگ سفارشی...</option>
              </select>
              <button
                type="button"
                onClick={addColor}
                className="admin-btn admin-btn-secondary"
              >
                <Plus size={14} />
              </button>
            </div>
            {colorChoice === "custom" && (
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-10 h-9 rounded border border-gray-300 p-0.5"
                />
                <input
                  type="text"
                  placeholder="نام رنگ سفارشی"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="admin-input flex-1"
                />
              </div>
            )}
          </div>

          <div className="admin-form-group">
            <label>سایزهای موجود</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {sizes.map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs"
                >
                  {s}
                  <button type="button" onClick={() => removeSize(i)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="مثلاً: 42 یا M"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSize();
                  }
                }}
                className="admin-input flex-1"
              />
              <button
                type="button"
                onClick={addSize}
                className="admin-btn admin-btn-secondary"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {!bulkMode && (
            <div className="admin-form-group">
              <label>تخفیف پلکانی بر اساس تعداد (اختیاری)</label>
              <div className="space-y-2 mb-2">
                {tiers.map((t) => (
                  <div key={t.id} className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="از"
                      value={t.minQty}
                      onChange={(e) =>
                        updateTier(t.id, "minQty", e.target.value)
                      }
                      className="admin-input"
                    />
                    <input
                      type="number"
                      placeholder="تا"
                      value={t.maxQty}
                      onChange={(e) =>
                        updateTier(t.id, "maxQty", e.target.value)
                      }
                      className="admin-input"
                    />
                    <input
                      type="number"
                      placeholder="قیمت واحد"
                      value={t.unitPrice}
                      onChange={(e) =>
                        updateTier(t.id, "unitPrice", e.target.value)
                      }
                      className="admin-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(t.id)}
                      className="admin-btn admin-btn-danger"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTier}
                className="admin-btn admin-btn-secondary flex items-center gap-1"
              >
                <Plus size={14} /> افزودن بازه تعداد
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving || uploading || descUploading}
          className="admin-btn admin-btn-primary"
        >
          {saving
            ? "در حال ذخیره..."
            : bulkMode
            ? `ثبت ${variantRows.filter((r) => r.name.trim()).length.toLocaleString("fa-IR")} محصول`
            : "ذخیره محصول"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="admin-btn admin-btn-secondary"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}