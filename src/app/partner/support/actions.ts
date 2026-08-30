"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActivePartner } from "@/lib/partners/auth";
import { notifyAllAdmins } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function createPartnerTicketAction(subject: string) {
  const partner = await requireActivePartner();
  const admin = createAdminClient();
  const { data, error } = await admin.from("partner_tickets").insert({ partner_id: partner.id, subject }).select("id").single();
  if (error || !data) return { error: "خطا در ایجاد گفتگو" };
  try { await notifyAllAdmins("پیام جدید از همکار 💬", `«${partner.business_name}»: ${subject}`); } catch (e) { console.error(e); }
  return { success: true, ticketId: data.id };
}

export async function sendPartnerMessageAction(ticketId: string, message: string) {
  const partner = await requireActivePartner();
  const admin = createAdminClient();
  const { data: ticket } = await admin.from("partner_tickets").select("partner_id").eq("id", ticketId).single();
  if (!ticket || ticket.partner_id !== partner.id) return { error: "دسترسی غیرمجاز" };

  await admin.from("partner_ticket_messages").insert({ ticket_id: ticketId, sender_role: "PARTNER", sender_name: partner.business_name, message });
  await admin.from("partner_tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
  revalidatePath(`/partner/support/${ticketId}`);
  return { success: true };
}

export async function markPartnerTicketSeenAction(ticketId: string) {
  const admin = createAdminClient();
  await admin.from("partner_tickets").update({ partner_last_seen_at: new Date().toISOString() }).eq("id", ticketId);
  return { success: true };
}

export async function getPartnerTicketMessages(ticketId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("partner_ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
  return data ?? [];
}