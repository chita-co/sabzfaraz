// src/app/admin/partners/withdrawals/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { approveWithdrawalAction, rejectWithdrawalAction } from "./actions";

export default async function AdminWithdrawalsPage() {
  const admin = createAdminClient();
  const { data: requests } = await admin
    .from("partner_withdrawal_requests")
    .select("id, amount, sheba_number, card_number, status, created_at, partner:partners(business_name, phone)")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>درخواست‌های برداشت همکاران</h1>
      <div className="admin-card">
        {(!requests || requests.length === 0) ? (
          <p className="text-gray-500 text-sm text-center py-6">درخواستی در انتظار نیست.</p>
        ) : (
           requests.map((r: {
            id: string;
            amount: number;
            sheba_number: string | null;
            card_number: string | null;
            status: string;
            created_at: string;
            partner: { business_name: string | null; phone: string | null } | { business_name: string | null; phone: string | null }[] | null;
          }) => {
            const partner = Array.isArray(r.partner) ? r.partner[0] : r.partner;
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", padding: "12px 0" }}>
                <div>
                  <p style={{ fontWeight: 700 }}>{partner?.business_name} — {r.amount.toLocaleString("fa-IR")} تومان</p>
                  <p style={{ fontSize: 12, color: "#6b7280" }} dir="ltr">{r.sheba_number || r.card_number}</p>
                </div>
                <form action={async (formData) => { "use server"; await approveWithdrawalAction(r.id, String(formData.get("ref"))); }} style={{ display: "flex", gap: 6 }}>
                  <input name="ref" className="admin-input" placeholder="شماره پیگیری" style={{ width: 140, fontSize: 12 }} required />
                  <button className="admin-btn admin-btn-primary">تأیید و پرداخت‌شده</button>
                </form>
                <form action={async () => { "use server"; await rejectWithdrawalAction(r.id); }}>
                  <button className="admin-btn admin-btn-danger">رد</button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}