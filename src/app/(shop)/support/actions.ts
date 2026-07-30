"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTicket(subject: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, subject: subject || "درخواست پشتیبانی" })
    .select()
    .single();

  if (error || !ticket) return { error: "خطا در ایجاد گفتگو." };
  redirect(`/support/${ticket.id}`);
}

export async function sendUserMessage(ticketId: string, message: string, imageUrl: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const { error } = await supabase.from("support_messages").insert({
    ticket_id: ticketId,
    sender_role: "USER",
    sender_name: profile?.full_name || "کاربر",
    message: message || null,
    image_url: imageUrl,
  });
  if (error) return { error: error.message };

  await supabase.from("support_tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
  revalidatePath(`/support/${ticketId}`);
  return { success: true };
}

export async function editUserMessage(messageId: string, newText: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("support_messages").update({ message: newText }).eq("id", messageId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getTicketMessages(ticketId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return data ?? [];
}