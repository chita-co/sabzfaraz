// src/components/admin/CategoryManager.tsx
"use client";

import { useState } from "react";
import Image from "next/image"; // ← اضافه شد
import { Plus, Pencil, Trash2, X, Upload, Loader2, FolderPlus, Wand2 } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/admin/categories/actions";
import { Category } from "@/types";
import ProductRecategorizePanel from "@/components/admin/ProductRecategorizePanel";
import AdminProductPicker from "@/components/admin/AdminProductPicker";
import type { RTProduct } from "@/components/shared/RecategorizeTable";
import { autofillCategorySeoAction } from "@/app/admin/categories/seo-actions";

type CategoryWithSeo = Category & {
  short_description?: string | null;
  tags?: string[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
  focus_keyword?: string | null;
};

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"categories" | "products">("categories");
  const [recatProducts, setRecatProducts] = useState<RTProduct[] | null>(null);
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [focusKw, setFocusKw] = useState("");
  const [seoBusy, setSeoBusy] = useState(false);
  const [seoMsg, setSeoMsg] = useState<string | null>(null);

  function sortHierarchy(cats: Category[]) {
    const byParent: Record<string, Category[]> = {};
    cats.forEach((c) => {
      const key = c.parent_id ?? "root";
      if (!byParent[key]) byParent[key] = [];
      byParent[key].push(c);
    });
    const result: (Category & { depth: number })[] = [];
    function walk(parentKey: string, depth: number) {
      (byParent[parentKey] ?? []).forEach((c) => {
        result.push({ ...c, depth });
        walk(c.id, depth + 1);
      });
    }
    walk("root", 0);
    return result;
  }

  function openCreate(presetParent: string = "") {
    setEditing(null);
    setError(null);
    setSeoMsg(null);
    setImageUrl(null);
    setName("");
    setDesc("");
    setParentId(presetParent);
    setShortDesc("");
    setTagsText("");
    setMetaTitle("");
    setMetaDesc("");
    setFocusKw("");
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    const c = cat as CategoryWithSeo;
    setEditing(cat);
    setError(null);
    setSeoMsg(null);
    setImageUrl(cat.image ?? null);
    setName(c.name);
    setDesc(c.description ?? "");
    setParentId(c.parent_id ?? "");
    setShortDesc(c.short_description ?? "");
    setTagsText((c.tags ?? []).join("، "));
    setMetaTitle(c.meta_title ?? "");
    setMetaDesc(c.meta_description ?? "");
    setFocusKw(c.focus_keyword ?? "");
    setShowModal(true);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setImageUrl(data.url);
      else alert(data.error || "خطا در آپلود تصویر");
    } catch {
      alert("خطا در ارتباط با سرور برای آپلود تصویر");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleAutoSeo() {
    if (name.trim().length < 2) {
      setSeoMsg("ابتدا نام دسته‌بندی را وارد کنید.");
      return;
    }
    setSeoBusy(true);
    setSeoMsg(null);
    const parentName = categories.find((c) => c.id === parentId)?.name ?? "";
    const res = await autofillCategorySeoAction({
      name,
      parentName,
      description: desc,
      categoryId: editing?.id ?? null,
    });
    setSeoBusy(false);
    if (res.error || !res.data) {
      setSeoMsg(res.error ?? "خطا در تولید متن سئو");
      return;
    }
    const d = res.data;
    setShortDesc(d.shortDescription);
    setTagsText(d.tags.join("، "));
    setMetaTitle(d.metaTitle);
    setMetaDesc(d.metaDescription);
    setFocusKw(d.focusKeyword);
    setSeoMsg("پر شد. قبل از ذخیره بررسی کنید.");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("image", imageUrl ?? "");

    const result = editing
      ? await updateCategory(editing.id, formData)
      : await createCategory(formData);

    setLoading(false);
    if (result?.error) setError(result.error);
    else setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این دسته‌بندی مطمئن هستید؟")) return;
    setDeletingId(id);
    const result = await deleteCategory(id);
    setDeletingId(null);
    if (result?.error) alert(result.error);
  }

  const sorted = sortHierarchy(categories);
  const parentOptions = categories.filter((c) => !editing || c.id !== editing.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">مدیریت دسته‌بندی‌ها</h1>
          {!recatProducts && (
            <div className="flex items-center gap-2">
              <button
                className={`admin-btn ${tab === "categories" ? "admin-btn-primary" : "admin-btn-secondary"}`}
                onClick={() => setTab("categories")}
              >
                دسته‌بندی‌ها
              </button>
              <button
                className={`admin-btn ${tab === "products" ? "admin-btn-primary" : "admin-btn-secondary"}`}
                onClick={() => setTab("products")}
              >
                محصولات و تغییر دسته‌بندی
              </button>
            </div>
          )}
        </div>
        {!recatProducts && tab === "categories" && (
          <button className="admin-btn admin-btn-primary flex items-center gap-2" onClick={() => openCreate()}>
            <Plus size={16} />
            دسته‌بندی جدید
          </button>
        )}
      </div>

      {recatProducts ? (
        <ProductRecategorizePanel
          products={recatProducts}
          categories={categories}
          onClose={() => setRecatProducts(null)}
        />
      ) : tab === "products" ? (
        <AdminProductPicker categories={categories} onStart={setRecatProducts} />
      ) : (
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>تصویر</th>
              <th>نام</th>
              <th>اسلاگ</th>
              <th>وضعیت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((cat) => (
              <tr key={cat.id}>
                <td>
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={48}
                      height={48}
                      unoptimized
                      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 48, background: "#f3f4f6", borderRadius: 8 }} />
                  )}
                </td>
                <td style={{ paddingRight: cat.depth * 20 }}>
                  {cat.depth > 0 && "└ "}
                  {cat.name}
                </td>
                <td dir="ltr" className="text-left">
                  {cat.slug}
                </td>
                <td>
                  <span
                    className={
                      cat.is_active
                        ? "text-green-600 text-xs font-medium"
                        : "text-gray-400 text-xs font-medium"
                    }
                  >
                    {cat.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="admin-btn admin-btn-secondary flex items-center gap-1"
                      onClick={() => openCreate(cat.id)}
                      title="افزودن زیردسته"
                    >
                      <FolderPlus size={14} /> زیردسته
                    </button>
                    <button className="admin-btn admin-btn-secondary" onClick={() => openEdit(cat)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">هنوز دسته‌بندی‌ای ثبت نشده است.</p>
        )}
      </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">
                {editing ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>نام دسته‌بندی</label>
                <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="admin-form-group">
                <label>اسلاگ (انگلیسی)</label>
                <input type="text" name="slug" dir="ltr" placeholder="مثلاً: sensors" defaultValue={editing?.slug} />
              </div>

              <div className="admin-form-group">
                <label>توضیحات</label>
                <textarea name="description" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>

              <div className="admin-form-group" style={{ border: "1px solid #bbf7d0", borderRadius: 10, padding: 12 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-800">توضیح کوتاه، برچسب‌ها و سئو</span>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary flex items-center gap-1"
                    onClick={handleAutoSeo}
                    disabled={seoBusy}
                  >
                    {seoBusy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {seoBusy ? "لطفاً منتظر بمانید…" : "پر کردن خودکار با هوش مصنوعی"}
                  </button>
                </div>
                {seoMsg && <p className="text-xs text-gray-500 mb-2">{seoMsg}</p>}

                <label>توضیح کوتاه (برای نمایش در لیست و خلاصه گوگل)</label>
                <textarea name="shortDescription" rows={2} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />

                <label>برچسب‌ها (با ویرگول جدا کنید)</label>
                <input type="text" name="tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />

                <label>عنوان سئو (Meta Title — حداکثر ۶۰ کاراکتر)</label>
                <input type="text" name="metaTitle" maxLength={60} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                <p className="text-xs text-gray-400">{metaTitle.length.toLocaleString("fa-IR")} / ۶۰</p>

                <label>توضیحات متا (Meta Description — حداکثر ۱۶۰ کاراکتر)</label>
                <textarea name="metaDescription" rows={2} maxLength={160} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} />
                <p className="text-xs text-gray-400">{metaDesc.length.toLocaleString("fa-IR")} / ۱۶۰</p>

                <label>کلمه کلیدی کانونی (اختیاری)</label>
                <input type="text" name="focusKeyword" value={focusKw} onChange={(e) => setFocusKw(e.target.value)} />
              </div>

              <div className="admin-form-group">
                <label>دسته والد (اختیاری — برای زیردسته)</label>
                <select name="parentId" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                  <option value="">بدون والد (دسته اصلی)</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>تصویر دسته‌بندی (برای اسلایدر صفحه اصلی)</label>
                {imageUrl && (
                  <div className="relative mb-2" style={{ width: 120, height: 80 }}>
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      className="object-cover rounded-lg border"
                      sizes="120px"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer text-sm text-gray-500 hover:border-green-500 hover:text-green-600">
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> در حال آپلود...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> انتخاب تصویر
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {editing && (
                <div className="admin-form-group flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    defaultChecked={editing.is_active}
                  />
                  <label htmlFor="isActive" style={{ marginBottom: 0 }}>
                    نمایش در فروشگاه (فعال)
                  </label>
                </div>
              )}

              <div className="admin-form-group flex items-center gap-2">
                <input
                  type="checkbox"
                  name="partnerAllowed"
                  id="partnerAllowed"
                  defaultChecked={editing ? Boolean((editing as unknown as { partner_allowed?: boolean }).partner_allowed) : true}
                />
                <label htmlFor="partnerAllowed" style={{ marginBottom: 0 }}>
                  همکاران فروشگاه هم بتوانند محصول در این دسته‌بندی ثبت کنند
                </label>
              </div>

              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

              <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={loading || uploading}>
                {loading ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}