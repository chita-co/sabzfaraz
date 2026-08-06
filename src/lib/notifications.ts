import { createAdminClient } from "@/lib/supabase/admin";

export async function createNotification(userId: string, title: string, message: string) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({ user_id: userId, title, message });
}