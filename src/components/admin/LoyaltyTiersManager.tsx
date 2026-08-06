"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Award } from "lucide-react";
import { createTier, updateTier, deleteTier } from "@/app/admin/loyalty/actions";

interface Tier {
  id: string; name: string; min_lifetime_points: number; points_multiplier: number;
  free_shipping: boolean; permanent_discount_percent: number; badge_color: string; sort_order: number;
}

export default function LoyaltyTiersManager({ tiers }: { tiers: Tier[] }) {
  const [rows, setRows] = useState(tiers);
  const [showNew, setShowNew] = useState(false);

  async function handleUpdate(id: string, formData: FormData) {
    await updateTier(id, formData);
    window.location.reload();
  }

  async function handleCreate(formData: FormData) {
    await createTier(formData);
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این سطح مطمئن هستید؟")) return;
    const result = await deleteTier(id);
    if (result?.error) alert(result.error);
    else setRows((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">سطوح باشگاه مشتریان</h1>
        <button onClick={() => setShowNew((v) => !v)} className="admin-btn admin-btn-primary flex items-center gap-2">
          <Plus size={16} /> افزودن سطح جدید
        </button>
      </div>

      {showNew && (
        <form action={handleCreate} className="admin-card mb-5">
          <h2 className="font-bold text-gray-800 mb-3">سطح جدید</h2>
          <TierFields />
          <button type="submit" className="admin-btn admin-btn-primary mt-3 flex items-center gap-2"><Save size={14} /> ذخیره</button>
        </form>
      )}

      <div className="space-y-4">
        {rows.map((t) => (
          <form key={t.id} action={(fd) => handleUpdate(t.id, fd)} className="admin-card">
            <div className="flex items-center gap-2 mb-3">
              <Award size={18} style={{ color: t.badge_color }} />
              <h2 className="font-bold text-gray-800">{t.name}</h2>
              <button type="button" onClick={() => handleDelete(t.id)} className="admin-btn admin-btn-danger" style={{ marginRight: "auto" }}>
                <Trash2 size={13} />
              </button>
            </div>
            <TierFields defaults={t} />
            <button type="submit" className="admin-btn admin-btn-secondary mt-3 flex items-center gap-2"><Save size={14} /> ذخیره تغییرات</button>
          </form>
        ))}
      </div>
    </div>
  );
}

function TierFields({ defaults }: { defaults?: Tier }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <div className="admin-form-group"><label>نام سطح</label><input type="text" name="name" defaultValue={defaults?.name} required /></div>
      <div className="admin-form-group"><label>حداقل امتیاز کل (Lifetime)</label><input type="number" name="minPoints" defaultValue={defaults?.min_lifetime_points ?? 0} min={0} /></div>
      <div className="admin-form-group"><label>ضریب کسب امتیاز</label><input type="number" step="0.1" name="multiplier" defaultValue={defaults?.points_multiplier ?? 1} min={0.1} /></div>
      <div className="admin-form-group"><label>تخفیف دائمی (٪)</label><input type="number" name="discountPercent" defaultValue={defaults?.permanent_discount_percent ?? 0} min={0} max={100} /></div>
      <div className="admin-form-group"><label>رنگ نشان</label><input type="color" name="badgeColor" defaultValue={defaults?.badge_color ?? "#9ca3af"} style={{ height: 38, padding: 2 }} /></div>
      <div className="admin-form-group"><label>ترتیب نمایش</label><input type="number" name="sortOrder" defaultValue={defaults?.sort_order ?? 0} /></div>
      <div className="admin-form-group flex items-center gap-2" style={{ alignSelf: "end" }}>
        <input type="checkbox" id={`fs-${defaults?.id ?? "new"}`} name="freeShipping" defaultChecked={defaults?.free_shipping} />
        <label htmlFor={`fs-${defaults?.id ?? "new"}`} style={{ marginBottom: 0 }}>ارسال رایگان</label>
      </div>
    </div>
  );
}