"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
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

export async function markTicketSeenByAdminAction(ticketId: string) {
  const supabase = await createClient();
  await supabase.from("support_tickets").update({ admin_last_seen_at: new Date().toISOString() }).eq("id", ticketId);
  return { success: true };
}

export async function startAdminTicket(userId: string, subject: string, message: string, imageUrl: string | null = null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };
  if (!message.trim() && !imageUrl) return { error: "متن پیام نمی‌تواند خالی باشد." };

  const admin = createAdminClient();

  const [{ data: adminProfile }, { data: userProfile }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).single(),
    admin.from("profiles").select("full_name").eq("id", userId).single(),
  ]);
  if (!userProfile) return { error: "کاربر یافت نشد." };

  // اگر این کاربر از قبل یک گفتگوی باز دارد، همان‌جا پیام اضافه می‌شود؛
  // اگر ندارد (دقیقاً حالت «کاربری که تا حالا پیام نداده»)، یک گفتگوی تازه ساخته می‌شود
  const { data: existingTicket } = await admin
    .from("support_tickets")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "OPEN")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let ticketId = existingTicket?.id as string | undefined;

  if (!ticketId) {
    const { data: ticket, error: ticketError } = await admin
      .from("support_tickets")
      .insert({
        user_id: userId,
        subject: subject.trim() || "پیام از پشتیبانی",
        status: "OPEN",
        updated_at: new Date().toISOString(),
        admin_last_seen_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (ticketError || !ticket) return { error: ticketError?.message ?? "خطا در ایجاد گفتگو." };
    ticketId = ticket.id;
  }

  const { error: msgError } = await admin.from("support_messages").insert({
    ticket_id: ticketId,
    sender_role: "ADMIN",
    sender_name: adminProfile?.full_name || "پشتیبانی",
    message: message.trim() || null,
    image_url: imageUrl,
  });
  if (msgError) return { error: msgError.message };

  await admin
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString(), admin_last_seen_at: new Date().toISOString() })
    .eq("id", ticketId);

  await createNotification(userId, "پیام جدید از پشتیبانی 💬", "پشتیبانی سبزفراز برایتان پیام جدیدی ارسال کرده است.");

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { success: true, ticketId };
}

export async function editAdminMessage(messageId: string, newText: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("support_messages")
    .update({ message: newText })
    .eq("id", messageId)
    .eq("sender_role", "ADMIN");
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteAdminMessage(messageId: string, ticketId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("support_messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_role", "ADMIN");
  if (error) return { error: error.message };
  revalidatePath(`/admin/support/${ticketId}`);
  return { success: true };
}