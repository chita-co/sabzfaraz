import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSupportChat from "@/components/admin/AdminSupportChat";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSupportTicketPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("support_tickets").select("*, profile:profiles(full_name)").eq("id", id).single();
  if (!ticket) notFound();

  await supabase.from("support_tickets").update({ admin_last_seen_at: new Date().toISOString() }).eq("id", id);

  const { data: messages } = await supabase
    .from("support_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">{ticket.subject}</h1>
      <p className="text-sm text-gray-500 mb-5">کاربر: {ticket.profile?.full_name ?? "—"}</p>
      <AdminSupportChat ticketId={id} initialMessages={messages ?? []} isClosed={ticket.status === "CLOSED"} />
    </div>
  );
}