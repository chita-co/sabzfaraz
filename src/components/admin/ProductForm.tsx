// src/components/admin/ProductForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // ← اضافه شد
import { Plus, X, Upload, Loader2 } from "lucide-react";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import { Category, Product, ProductColor } from "@/types";

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

export default function ProductForm({
  mode,
  product,
  categories,
}: {
  mode: "create" | "edit";
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();

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

  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);

  const [colors, setColors] = useState<ProductColor[]>(product?.colors ?? []);
  const [colorChoice, setColorChoice] = useState("0");
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#2175f5");

  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [sizeInput, setSizeInput] = useState("");

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
        if (res.ok) {
          setImages((prev) => [...prev, data.url]);
        } else {
          alert(data.error || "خطا در آپلود تصویر");
        }
      } catch {
        alert("خطا در ارتباط با سرور برای آپلود تصویر");
      }
    }
    setUploading(false);
    e.target.value = "";
  }

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

    setSaving(true);

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
      images,
      colors,
      sizes,
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
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {mode === "edit" ? "ویرایش محصول" : "افزودن محصول جدید"}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="admin-form-group">
            <label>نام محصول (فارسی)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="admin-form-group">
            <label>نام محصول (انگلیسی — اختیاری، زیر نام فارسی نمایش داده می‌شود)</label>
            <input
              type="text"
              dir="ltr"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="مثلاً: HC-SR04 Ultrasonic Sensor"
            />
          </div>

          <div className="admin-form-group">
            <label>اسلاگ (انگلیسی، اختیاری — خالی بگذارید تا خودکار ساخته شود)</label>
            <input
              type="text"
              dir="ltr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="مثلاً: hc-sr04-sensor"
            />
          </div>

          <div className="admin-form-group">
            <label>توضیحات محصول</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group">
              <label>قیمت (تومان)</label>
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
              <label>موجودی (اختیاری — خالی = نامحدود)</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min={0}
                placeholder="مثلاً: 10"
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
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
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
            <label>تصاویر محصول</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {images.map((url) => (
                <div key={url} className="relative h-24">
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
            <label>رنگ‌های موجود</label>
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
              <button type="button" onClick={addColor} className="admin-btn admin-btn-secondary">
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
              <button type="button" onClick={addSize} className="admin-btn admin-btn-secondary">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <div className="flex gap-3 mt-6">
        <button type="submit" disabled={saving || uploading} className="admin-btn admin-btn-primary">
          {saving ? "در حال ذخیره..." : "ذخیره محصول"}
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