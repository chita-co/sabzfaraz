"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendAdminMessage(ticketId: string, message: string, imageUrl: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const { error } = await supabase.from("support_messages").insert({
    ticket_id: ticketId,
    sender_role: "ADMIN",
    sender_name: profile?.full_name || "پشتیبانی",
    message: message || null,
    image_url: imageUrl,
  });
  if (error) return { error: error.message };

  await supabase.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
  revalidatePath(`/admin/support/${ticketId}`);
  return { success: true };
}

export async function closeTicket(ticketId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("support_tickets").update({ status: "CLOSED" }).eq("id", ticketId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
  return { success: true };
}

export async function deleteTicket(ticketId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("support_tickets").delete().eq("id", ticketId);
  if (error) return { error: error.message };
  revalidatePath("/admin/support");
  return { success: true };
}

export async function getAdminTicketMessages(ticketId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
  return data ?? [];
}