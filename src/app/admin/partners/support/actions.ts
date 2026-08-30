// src/app/admin/partners/support/actions.ts
"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function sendAdminPartnerMessageAction(ticketId: string, message: string) {
  const admin = createAdminClient();
  const { data: ticket } = await admin.from("partner_tickets").select("partner_id").eq("id", ticketId).single();
  if (!ticket) return { error: "گفتگو یافت نشد" };

  await admin.from("partner_ticket_messages").insert({ ticket_id: ticketId, sender_role: "ADMIN", sender_name: "پشتیبانی سبزفراز", message });
  await admin.from("partner_tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
  await createNotification(ticket.partner_id, "پاسخ جدید از پشتیبانی 💬", message.slice(0, 80));
  revalidatePath(`/admin/partners/support/${ticketId}`);
  return { success: true };
}

export async function getAdminPartnerTicketMessages(ticketId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("partner_ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
  return data ?? [];
}

export async function closePartnerTicketAction(ticketId: string) {
  const admin = createAdminClient();
  await admin.from("partner_tickets").update({ status: "CLOSED" }).eq("id", ticketId);
  revalidatePath(`/admin/partners/support/${ticketId}`);
  return { success: true };
}