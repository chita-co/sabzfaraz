// src/app/admin/partners/support/[id]/page.tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminPartnerChat from "@/components/admin/AdminPartnerChat";

export default async function AdminPartnerTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: ticket } = await admin.from("partner_tickets").select("*, partner:partners(business_name)").eq("id", id).single();
  if (!ticket) notFound();
  await admin.from("partner_tickets").update({ admin_last_seen_at: new Date().toISOString() }).eq("id", id);
  const { data: messages } = await admin.from("partner_ticket_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true });

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{ticket.subject}</h1>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>همکار: {ticket.partner?.business_name}</p>
      <AdminPartnerChat ticketId={id} initialMessages={messages ?? []} isClosed={ticket.status === "CLOSED"} />
    </div>
  );
}