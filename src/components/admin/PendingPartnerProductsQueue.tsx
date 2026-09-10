"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  approvePartnerProductAction,
  rejectPartnerProductAction,
  bulkApprovePartnerProductsAction,
  bulkRejectPartnerProductsAction,
} from "@/app/admin/partners/products/actions";

interface PendingProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  partner_cost_price: number | null;
  stock: number;
  images: string[];
  category: { name: string } | { name: string }[] | null;
  partner: { business_name: string | null; phone: string | null } | { business_name: string | null; phone: string | null }[] | null;
}

const REJECT_REASONS = [
  "کیفیت تصویر نامناسب",
  "قیمت نامناسب",
  "توضیحات ناقص",
  "دسته‌بندی اشتباه",
  "مغایرت با قوانین",
];

export default function PendingPartnerProductsQueue({ products }: { products: PendingProduct[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupReason, setGroupReason] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const groups = useMemo(() => {
    const map = new Map<string, PendingProduct[]>();
    for (const p of products) {
      const key = p.name.trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [products]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleGroup(ids: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  function clearFromSelection(ids: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  function handleSingleApprove(id: string) {
    startTransition(async () => {
      const res = await approvePartnerProductAction(id);
      if (res?.error) { toast.error(res.error); return; }
      toast.success("محصول تأیید و منتشر شد.");
      clearFromSelection([id]);
    });
  }

  function handleSingleReject(id: string, reason: string) {
    startTransition(async () => {
      const res = await rejectPartnerProductAction(id, reason);
      if (res?.error) { toast.error(res.error); return; }
      toast.success("محصول رد شد.");
      clearFromSelection([id]);
    });
  }

  function handleGroupApprove(ids: string[]) {
    const chosen = ids.filter((id) => selected.has(id));
    if (chosen.length === 0) return toast.error("هیچ محصولی از این گروه انتخاب نشده.");
    startTransition(async () => {
      const res = await bulkApprovePartnerProductsAction(chosen);
      if (res?.error) { toast.error(res.error); return; }
      toast.success(`${res.count} محصول تأیید و منتشر شد.`);
      clearFromSelection(chosen);
    });
  }

  function handleGroupReject(ids: string[], groupKey: string) {
    const chosen = ids.filter((id) => selected.has(id));
    if (chosen.length === 0) return toast.error("هیچ محصولی از این گروه انتخاب نشده.");
    const reason = groupReason[groupKey] || REJECT_REASONS[2];
    startTransition(async () => {
      const res = await bulkRejectPartnerProductsAction(chosen, reason);
      if (res?.error) { toast.error(res.error); return; }
      toast.success(`${res.count} محصول رد شد.`);
      clearFromSelection(chosen);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {groups.map(([groupName, groupProducts]) => {
        const ids = groupProducts.map((p) => p.id);
        const allChecked = ids.every((id) => selected.has(id));
        const someChecked = ids.some((id) => selected.has(id));
        return (
          <div key={groupName} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: "1px dashed #e5e7eb",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                  onChange={(e) => toggleGroup(ids, e.target.checked)}
                />
                {groupName}{" "}
                <span style={{ fontWeight: 400, color: "#6b7280", fontSize: 12 }}>
                  ({groupProducts.length.toLocaleString("fa-IR")} محصول)
                </span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select
                  className="admin-input"
                  style={{ fontSize: 11 }}
                  value={groupReason[groupName] || REJECT_REASONS[2]}
                  onChange={(e) => setGroupReason((prev) => ({ ...prev, [groupName]: e.target.value }))}
                >
                  {REJECT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button disabled={pending} className="admin-btn admin-btn-danger" onClick={() => handleGroupReject(ids, groupName)}>
                  رد گروهی انتخاب‌شده‌ها
                </button>
                <button disabled={pending} className="admin-btn admin-btn-primary" onClick={() => handleGroupApprove(ids)}>
                  تأیید گروهی انتخاب‌شده‌ها
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {groupProducts.map((p) => {
                const profit = p.price - (p.partner_cost_price ?? 0);
                const profitPercent = p.price > 0 ? ((profit / p.price) * 100).toFixed(1) : "0";
                const category = Array.isArray(p.category) ? p.category[0] : p.category;
                const partner = Array.isArray(p.partner) ? p.partner[0] : p.partner;
                return (
                  <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, display: "flex", gap: 14 }}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      style={{ alignSelf: "flex-start", marginTop: 4 }}
                    />
                    {p.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} style={{ width: 90, height: 90, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800 }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: "#6b7280" }}>همکار: {partner?.business_name} — {partner?.phone}</p>
                      <p style={{ fontSize: 12, color: "#6b7280" }}>دسته: {category?.name ?? "—"}</p>
                      <p style={{ fontSize: 12 }}>
                        فروش: {p.price.toLocaleString("fa-IR")} تومان — دریافتی همکار: {(p.partner_cost_price ?? 0).toLocaleString("fa-IR")} تومان — سود سایت: {profitPercent}٪
                      </p>
                      <p style={{ fontSize: 12 }}>موجودی: {p.stock.toLocaleString("fa-IR")}</p>
                      <div
                        dangerouslySetInnerHTML={{ __html: p.description }}
                        style={{ fontSize: 12, color: "#4b5563", marginTop: 6, maxHeight: 80, overflow: "hidden" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <Link href={`/admin/products/${p.id}/edit`} className="admin-btn admin-btn-secondary" style={{ textAlign: "center" }}>
                        ویرایش کامل
                      </Link>
                      <button disabled={pending} className="admin-btn admin-btn-primary" style={{ width: "100%" }} onClick={() => handleSingleApprove(p.id)}>
                        تأیید و انتشار
                      </button>
                      <RejectButton productId={p.id} pending={pending} onReject={handleSingleReject} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RejectButton({
  productId, pending, onReject,
}: { productId: string; pending: boolean; onReject: (id: string, reason: string) => void }) {
  const [reason, setReason] = useState(REJECT_REASONS[2]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="admin-input" style={{ fontSize: 11 }}>
        {REJECT_REASONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button disabled={pending} className="admin-btn admin-btn-danger" onClick={() => onReject(productId, reason)}>
        رد محصول
      </button>
    </div>
  );
}