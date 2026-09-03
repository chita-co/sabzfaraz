"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Search, Tags } from "lucide-react";
import { confirmPickupFromPartnerAction, confirmDeliveryToCustomerAction, returnFromCustomerAction } from "@/app/admin/partners/orders/actions";
import StockShortageModal from "./StockShortageModal";

interface OrderItemRow {
  id: string; product_name: string; quantity: number; price: number; partner_cost_price: number | null;
  partner_fulfillment_status: string; created_at: string; selected_color: string | null; selected_size: string | null;
  partner: { id: string; business_name: string; phone: string; partner_code: string } | null;
  order: { order_number: string; user_id: string; profile: { full_name: string | null } | null } | null;
}
interface PartnerOption { id: string; business_name: string; partner_code: string | null; }

const STATUS_COLORS: Record<string, string> = {
  PENDING: "badge-warning", PREPARING: "badge-info", READY_FOR_PICKUP: "badge-info",
  PICKED_UP: "badge-info", DELIVERED_TO_CUSTOMER: "badge-success",
  STOCK_SHORTAGE: "badge-danger", RETURNED_BY_CUSTOMER: "badge-danger", CANCELLED: "badge-danger",
};

export default function PartnerOrdersManager({
  items, partners, statusLabels,
}: { items: OrderItemRow[]; partners: PartnerOption[]; statusLabels: Record<string, string> }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [shortageItem, setShortageItem] = useState<OrderItemRow | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }
  function toggleAll() {
    setSelected(selected.length === items.length ? [] : items.map((i) => i.id));
  }

  async function handleConfirmPickup() {
    if (selected.length === 0) return toast.error("حداقل یک مورد انتخاب کنید.");
    setBusy(true);
    const res = await confirmPickupFromPartnerAction(selected);
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success(`${res.count} مورد تأیید شد.`);
    setSelected([]);
    router.refresh();
  }

  async function handleConfirmDelivery() {
    if (selected.length === 0) return toast.error("حداقل یک مورد انتخاب کنید.");
    setBusy(true);
    const res = await confirmDeliveryToCustomerAction(selected);
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success(`${res.count} مورد به‌عنوان تحویل‌شده به مشتری ثبت شد.`);
    setSelected([]);
    router.refresh();
  }

  async function handleReturn(item: OrderItemRow) {
    const reason = prompt("دلیل برگشت از مشتری را بنویسید:");
    if (!reason) return;
    const res = await returnFromCustomerAction(item.id, reason);
    if (res.error) return toast.error(res.error);
    toast.success("ثبت شد.");
    router.refresh();
  }

  return (
    <div>
      <form method="GET" className="admin-filters-bar" style={{ marginBottom: 14 }}>
        <div className="admin-filters-search">
          <Search size={15} />
          <input type="text" name="q" placeholder="جستجو در نام محصول، شماره سفارش یا همکار..." />
        </div>
        <select name="partnerId" className="admin-input" style={{ minWidth: 180 }}>
          <option value="">همه همکاران</option>
          {partners.map((p) => <option key={p.id} value={p.id}>{p.business_name} {p.partner_code ? `(کد: ${p.partner_code})` : ""}</option>)}
        </select>
        <input type="date" name="from" className="admin-input" />
        <input type="date" name="to" className="admin-input" />
        <button type="submit" className="admin-filters-apply-btn">اعمال فیلتر</button>
      </form>

      {selected.length > 0 && (
        <div className="bulk-toolbar">
          <span>{selected.length.toLocaleString("fa-IR")} مورد انتخاب شده</span>
          <button onClick={handleConfirmPickup} disabled={busy} className="admin-btn admin-btn-primary" style={{ fontSize: 12 }}>تأیید تحویل از همکار</button>
          <button onClick={handleConfirmDelivery} disabled={busy} className="admin-btn admin-btn-primary" style={{ fontSize: 12, background: "#16a34a" }}>تأیید تحویل به مشتری</button>
          <Link href={`/admin/partners/orders/item-labels?ids=${selected.join(",")}`} target="_blank" className="admin-btn admin-btn-secondary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <Tags size={13} /> چاپ اتیکت این اقلام
          </Link>
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={toggleAll} /></th>
              <th>شماره سفارش</th><th>همکار</th><th>محصول</th><th>تعداد</th><th>مبلغ همکار</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td><input type="checkbox" checked={selected.includes(it.id)} onChange={() => toggle(it.id)} /></td>
                <td dir="ltr">{it.order?.order_number}</td>
                <td>{it.partner?.business_name} {it.partner?.partner_code ? <span style={{ color: "#9ca3af", fontSize: 11 }}>(کد {it.partner.partner_code})</span> : ""}</td>
                <td>{it.product_name}{[it.selected_color, it.selected_size].filter(Boolean).length > 0 && <span style={{ color: "#9ca3af", fontSize: 11 }}> — {[it.selected_color, it.selected_size].filter(Boolean).join(" / ")}</span>}</td>
                <td>{it.quantity.toLocaleString("fa-IR")}</td>
                <td>{((it.partner_cost_price ?? 0) * it.quantity).toLocaleString("fa-IR")}</td>
                <td><span className={`badge ${STATUS_COLORS[it.partner_fulfillment_status]}`}>{statusLabels[it.partner_fulfillment_status] ?? it.partner_fulfillment_status}</span></td>
                <td className="text-xs text-gray-500">{new Date(it.created_at).toLocaleDateString("fa-IR")}</td>
                <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {["PENDING", "PREPARING", "READY_FOR_PICKUP"].includes(it.partner_fulfillment_status) && (
                    <button onClick={() => setShortageItem(it)} className="admin-btn admin-btn-danger" style={{ padding: "4px 8px", fontSize: 11 }}>عدم تامین</button>
                  )}
                  {it.partner_fulfillment_status === "DELIVERED_TO_CUSTOMER" && (
                    <button onClick={() => handleReturn(it)} className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>برگشت از مشتری</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-gray-500 text-sm text-center py-6">موردی یافت نشد.</p>}
      </div>

      {shortageItem && <StockShortageModal item={shortageItem} onClose={() => setShortageItem(null)} />}
    </div>
  );
}