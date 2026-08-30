import { createAdminClient } from "@/lib/supabase/admin";
import { approvePartnerAction, rejectPartnerAction } from "./actions";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی", ACTIVE: "فعال", REJECTED: "رد شده", SUSPENDED: "تعلیق", BLOCKED: "مسدود",
};

export default async function AdminPartnersPage() {
  const admin = createAdminClient();
  const { data: partners } = await admin.from("partners").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>همکاران فروشگاه</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>نام فروشگاه</th><th>موبایل</th><th>وضعیت</th><th>کیف پول</th><th>تاریخ</th><th></th></tr></thead>
          <tbody>
            {(partners ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.business_name}</td>
                <td dir="ltr">{p.phone}</td>
                <td><span className={`badge ${p.status === "ACTIVE" ? "badge-success" : p.status === "PENDING_REVIEW" ? "badge-warning" : "badge-danger"}`}>{statusLabel[p.status]}</span></td>
                <td>{(p.wallet_available_balance + p.wallet_pending_balance).toLocaleString("fa-IR")} تومان</td>
                <td className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString("fa-IR")}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <Link href={`/admin/partners/${p.id}`} className="admin-btn admin-btn-secondary">جزئیات</Link>
                  {p.status === "PENDING_REVIEW" && (
                    <>
                      <form action={async () => { "use server"; await approvePartnerAction(p.id); }}>
                        <button className="admin-btn admin-btn-primary">تأیید</button>
                      </form>
                      <form action={async () => { "use server"; await rejectPartnerAction(p.id, "عدم تطابق مدارک"); }}>
                        <button className="admin-btn admin-btn-danger">رد</button>
                      </form>
                    </>
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