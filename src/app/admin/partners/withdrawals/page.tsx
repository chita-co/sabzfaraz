// src/app/admin/partners/withdrawals/page.tsx
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveWithdrawalAction, rejectWithdrawalAction } from "./actions";

type PartnerInfo = { business_name: string | null; phone: string | null } | { business_name: string | null; phone: string | null }[] | null;

type WithdrawalRow = {
  id: string;
  amount: number;
  sheba_number: string | null;
  card_number: string | null;
  status: string;
  reference_number: string | null;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  partner: PartnerInfo;
};

const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
  PENDING: { text: "در انتظار", color: "#b45309", bg: "#fef3c7" },
  PAID: { text: "پرداخت شده", color: "#15803d", bg: "#dcfce7" },
  REJECTED: { text: "رد شده", color: "#b91c1c", bg: "#fee2e2" },
};

const PER_PAGE = 50;

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PER_PAGE;

  const admin = createAdminClient();

  const [
    { data: requests },
    { data: history, count: totalHistory },
  ] = await Promise.all([
    admin
      .from("partner_withdrawal_requests")
      .select("id, amount, sheba_number, card_number, status, reference_number, admin_note, created_at, processed_at, partner:partners(business_name, phone)")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true }),
    admin
      .from("partner_withdrawal_requests")
      .select("id, amount, sheba_number, card_number, status, reference_number, admin_note, created_at, processed_at, partner:partners(business_name, phone)", { count: "exact" })
      .in("status", ["PAID", "REJECTED"])
      .order("processed_at", { ascending: false })
      .range(offset, offset + PER_PAGE - 1),
  ]);

  const pendingRows = (requests ?? []) as WithdrawalRow[];
  const historyRows = (history ?? []) as WithdrawalRow[];
  const totalPages = Math.ceil((totalHistory ?? 0) / PER_PAGE);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>درخواست‌های برداشت همکاران</h1>

      {/* ===== درخواست‌های در انتظار ===== */}
      <div className="admin-card">
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>در انتظار بررسی</h2>
        {pendingRows.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">درخواستی در انتظار نیست.</p>
        ) : (
          pendingRows.map((r) => {
            const partner = Array.isArray(r.partner) ? r.partner[0] : r.partner;
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", padding: "12px 0", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <p style={{ fontWeight: 700 }}>{partner?.business_name} — {r.amount.toLocaleString("fa-IR")} تومان</p>
                  <p style={{ fontSize: 12, color: "#6b7280" }} dir="ltr">{r.sheba_number || r.card_number}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>
                    تاریخ درخواست: {new Date(r.created_at).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}
                  </p>
                </div>
                <form action={async (formData) => { "use server"; await approveWithdrawalAction(r.id, String(formData.get("ref"))); }} style={{ display: "flex", gap: 6 }}>
                  <input name="ref" className="admin-input" placeholder="شماره پیگیری" style={{ width: 140, fontSize: 12 }} required />
                  <button className="admin-btn admin-btn-primary">تأیید و پرداخت‌شده</button>
                </form>
                <form action={async (formData) => { "use server"; await rejectWithdrawalAction(r.id, String(formData.get("note") || "")); }} style={{ display: "flex", gap: 6 }}>
  <input name="note" className="admin-input" placeholder="دلیل رد (اختیاری)" style={{ width: 160, fontSize: 12 }} />
  <button className="admin-btn admin-btn-danger">رد</button>
</form>
              </div>
            );
          })
        )}
      </div>

      {/* ===== تاریخچه درخواست‌ها ===== */}
      <div className="admin-card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          تاریخچه درخواست‌ها
          {totalHistory ? <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400, marginRight: 8 }}>— {totalHistory.toLocaleString("fa-IR")} درخواست</span> : null}
        </h2>

        {historyRows.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">هنوز تاریخچه‌ای ثبت نشده.</p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
  <tr style={{ textAlign: "right", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
    <th style={{ padding: 8 }}>تاریخ درخواست</th>
    <th style={{ padding: 8 }}>همکار</th>
    <th style={{ padding: 8 }}>مبلغ</th>
    <th style={{ padding: 8 }}>وضعیت</th>
    <th style={{ padding: 8 }}>تاریخ پردازش</th>
    <th style={{ padding: 8 }}>شماره پیگیری</th>
    <th style={{ padding: 8 }}>یادداشت</th>
  </tr>
</thead>
                <tbody>
                  {historyRows.map((r) => {
                    const partner = Array.isArray(r.partner) ? r.partner[0] : r.partner;
                    const s = statusLabel[r.status] ?? { text: r.status, color: "#374151", bg: "#f3f4f6" };
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                        <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                          {new Date(r.created_at).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}
                        </td>
                        <td style={{ padding: 8 }}>
                          <div style={{ fontWeight: 600 }}>{partner?.business_name ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }} dir="ltr">{partner?.phone ?? ""}</div>
                        </td>
                        <td style={{ padding: 8, fontWeight: 700 }}>{r.amount.toLocaleString("fa-IR")} تومان</td>
                        <td style={{ padding: 8 }}>
                          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700 }}>
                            {s.text}
                          </span>
                        </td>
                        <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                          {r.processed_at ? new Date(r.processed_at).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" }) : "—"}
                        </td>
                        <td style={{ padding: 8, fontSize: 11 }} dir="ltr">{r.reference_number ?? "—"}</td>
<td style={{ padding: 8, fontSize: 11, color: "#6b7280", maxWidth: 200 }}>
  {r.admin_note ?? "—"}
</td>
</tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ===== صفحه‌بندی ===== */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
                {currentPage > 1 && (
                  <Link href={`?page=${currentPage - 1}`} className="admin-btn admin-btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                    قبلی
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: "#9ca3af" }}>…</span>}
                      <Link
                        href={`?page=${p}`}
                        className={`admin-btn ${p === currentPage ? "admin-btn-primary" : "admin-btn-secondary"}`}
                        style={{ padding: "6px 12px", fontSize: 12, minWidth: 34, textAlign: "center" }}
                      >
                        {p.toLocaleString("fa-IR")}
                      </Link>
                    </span>
                  ))}
                {currentPage < totalPages && (
                  <Link href={`?page=${currentPage + 1}`} className="admin-btn admin-btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                    بعدی
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}