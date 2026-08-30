import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePartnerForPage } from "@/lib/partners/auth";
import { markPartnerTicketSeenAction } from "../actions";
import PartnerSupportChat from "@/components/partner/PartnerSupportChat";

export default async function PartnerTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();
  const { data: ticket } = await admin.from("partner_tickets").select("*").eq("id", id).eq("partner_id", partner.id).single();
  if (!ticket) notFound();

  await markPartnerTicketSeenAction(id);
  const { data: messages } = await admin.from("partner_ticket_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true });

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{ticket.subject}</h1>
      <PartnerSupportChat ticketId={id} initialMessages={messages ?? []} isClosed={ticket.status === "CLOSED"} />
    </div>
  );
}