import Link from "next/link";
import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import NewPartnerTicketButton from "@/components/partner/NewPartnerTicketButton";

export default async function PartnerSupportPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();
  const { data: tickets } = await admin.from("partner_tickets").select("*").eq("partner_id", partner.id).order("updated_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>پشتیبانی همکاران</h1>
        <NewPartnerTicketButton />
      </div>
      <div className="partner-card">
        {(tickets ?? []).map((t) => (
          <Link key={t.id} href={`/partner/support/${t.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6", textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: 13 }}>{t.subject}</span>
            <span style={{ fontSize: 11, color: t.status === "OPEN" ? "#16a34a" : "#9ca3af" }}>{t.status === "OPEN" ? "باز" : "بسته‌شده"}</span>
          </Link>
        ))}
        {(!tickets || tickets.length === 0) && <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>هنوز گفتگویی ثبت نکرده‌اید.</p>}
      </div>
    </div>
  );
}