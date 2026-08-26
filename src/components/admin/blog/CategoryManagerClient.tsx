"use client";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, ArrowLeftRight } from "lucide-react";
import { createCategoryAction, renameCategoryAction, moveCategoryPostsAction, assignPostToCategoryAction } from "@/app/admin/blog/actions";

interface Category { id: string; name: string; slug: string; }
interface UnassignedPost { id: string; title: string; pending_category_name: string | null; }

export default function CategoryManagerClient({ categories, unassignedPosts }: { categories: Category[]; unassignedPosts: UnassignedPost[] }) {
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveFrom, setMoveFrom] = useState("");
  const [moveTo, setMoveTo] = useState("");
  const [isPending, startTransition] = useTransition();

  function createCategory() {
    if (!newName.trim()) return;
    startTransition(async () => {
       const res = await createCategoryAction(newName);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      toast.success("دسته ساخته شد");
      setNewName("");
    });
  }

  function saveRename(id: string) {
    startTransition(async () => {
      const res = await renameCategoryAction(id, renameValue);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      toast.success("نام دسته تغییر کرد");
      setRenamingId(null);
    });
  }

  function movePosts() {
    if (!moveFrom || !moveTo || moveFrom === moveTo) return toast.error("دو دسته‌ی متفاوت انتخاب کنید");
    startTransition(async () => {
      const res = await moveCategoryPostsAction(moveFrom, moveTo);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      const result = res as { success: boolean; count?: number };
      toast.success(`${result.count ?? 0} مقاله جابه‌جا شد`);
    });
  }

  function assignUnassigned(postId: string, categoryId: string) {
    if (!categoryId) return;
    startTransition(async () => {
      const res = await assignPostToCategoryAction(postId, categoryId);
      if (res && 'error' in res) {
        toast.error((res as { error: string }).error);
        return;
      }
      toast.success("دسته اختصاص داده شد");
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="admin-card">
        <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>ساخت دسته‌بندی جدید</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="admin-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="نام دسته‌بندی" />
          <button className="admin-btn admin-btn-primary" disabled={isPending} onClick={createCategory} style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
            <Plus size={15} /> ساخت
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><ArrowLeftRight size={15} /> جابه‌جایی گروهی مقالات بین دسته‌ها</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select className="admin-input" value={moveFrom} onChange={(e) => setMoveFrom(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
            <option value="">از دسته...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ArrowLeftRight size={16} />
          <select className="admin-input" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
            <option value="">به دسته...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="admin-btn admin-btn-primary" disabled={isPending} onClick={movePosts}>انتقال همه</button>
        </div>
        <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 8 }}>همه‌ی مقالاتِ دسته‌ی «از» به دسته‌ی «به» منتقل می‌شوند (خود دسته‌ی مبدأ حذف نمی‌شود، فقط خالی می‌شود).</p>
      </div>

      {unassignedPosts.length > 0 && (
        <div className="admin-card">
          <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>مقالاتی که هنوز دسته‌ی قطعی ندارند</h3>
          {unassignedPosts.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6", gap: 8 }}>
              <span style={{ fontSize: 13 }}>{p.title} <span style={{ color: "#9ca3af", fontSize: 11 }}>(پیشنهاد ربات: {p.pending_category_name})</span></span>
              <select className="admin-input" style={{ width: 180 }} onChange={(e) => assignUnassigned(p.id, e.target.value)} defaultValue="">
                <option value="" disabled>انتخاب دسته...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>نام</th><th>اسلاگ</th><th>عملیات</th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{renamingId === c.id ? <input className="admin-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} style={{ fontSize: 12, padding: "4px 8px" }} /> : c.name}</td>
                <td>{c.slug}</td>
                <td>
                  {renamingId === c.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn admin-btn-primary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => saveRename(c.id)}>ذخیره</button>
                      <button className="admin-btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setRenamingId(null)}>انصراف</button>
                    </div>
                  ) : (
                    <button className="admin-btn" style={{ padding: "4px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }} onClick={() => { setRenamingId(c.id); setRenameValue(c.name); }}>
                      <Pencil size={12} /> تغییر نام
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}