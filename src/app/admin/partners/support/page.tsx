// src/app/admin/partners/support/page.tsx
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPartnerSupportPage() {
  const admin = createAdminClient();
  const { data: tickets } = await admin.from("partner_tickets").select("*, partner:partners(business_name)").order("updated_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>پیام‌های همکاران</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>همکار</th><th>موضوع</th><th>وضعیت</th><th></th></tr></thead>
          <tbody>
            {(tickets ?? []).map((t: {
              id: string;
              subject: string;
              status: string;
              partner: { business_name: string | null } | null;
            }) => (
              <tr key={t.id}>
                <td>{t.partner?.business_name}</td>
                <td>{t.subject}</td>
                <td><span className={`badge ${t.status === "OPEN" ? "badge-success" : "badge-info"}`}>{t.status === "OPEN" ? "باز" : "بسته"}</span></td>
                <td><Link href={`/admin/partners/support/${t.id}`} className="admin-btn admin-btn-secondary">مشاهده</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}