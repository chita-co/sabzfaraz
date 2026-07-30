// src/components/admin/CategoryManager.tsx
"use client";

import { useState } from "react";
import Image from "next/image"; // ← اضافه شد
import { Plus, Pencil, Trash2, X, Upload, Loader2 } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/admin/categories/actions";
import { Category } from "@/types";

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  function openCreate() {
    setEditing(null);
    setError(null);
    setImageUrl(null);
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setError(null);
    setImageUrl(cat.image ?? null);
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
        <h1 className="text-xl font-bold text-gray-900">مدیریت دسته‌بندی‌ها</h1>
        <button className="admin-btn admin-btn-primary flex items-center gap-2" onClick={openCreate}>
          <Plus size={16} />
          دسته‌بندی جدید
        </button>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>اسلاگ</th>
              <th>وضعیت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((cat) => (
              <tr key={cat.id}>
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
                <input type="text" name="name" defaultValue={editing?.name} required />
              </div>

              <div className="admin-form-group">
                <label>اسلاگ (انگلیسی)</label>
                <input type="text" name="slug" dir="ltr" placeholder="مثلاً: sensors" defaultValue={editing?.slug} />
              </div>

              <div className="admin-form-group">
                <label>توضیحات</label>
                <textarea name="description" rows={3} defaultValue={editing?.description ?? ""} />
              </div>

              <div className="admin-form-group">
                <label>دسته والد (اختیاری — برای زیردسته)</label>
                <select name="parentId" defaultValue={editing?.parent_id ?? ""}>
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