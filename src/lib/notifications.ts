import { createAdminClient } from "@/lib/supabase/admin";

export async function createNotification(userId: string, title: string, message: string) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({ user_id: userId, title, message });
}

export async function notifyAllAdmins(title: string, message: string) {
  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "ADMIN");
  if (!admins) return;
  await admin.from("notifications").insert(admins.map((a) => ({ user_id: a.id, title, message })));
}