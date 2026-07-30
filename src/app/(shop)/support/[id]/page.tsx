import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SupportChatClient from "@/components/shop/SupportChatClient";

export default async function SupportTicketPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ticket } = await supabase
    .from("support_tickets").select("*").eq("id", id).eq("user_id", user.id).single();
  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("support_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-lg font-bold text-gray-900 mb-4">{ticket.subject}</h1>
      <SupportChatClient ticketId={id} initialMessages={messages ?? []} isClosed={ticket.status === "CLOSED"} />
    </div>
  );
}