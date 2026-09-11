import { createAdminClient } from "@/lib/supabase/admin";

const SESSION_CAP_THRESHOLD = 9500;
const SESSION_CLEANUP_BATCH = 1000;

export async function cleanupOldSessionsIfNeeded() {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("analytics_sessions")
      .select("*", { count: "exact", head: true });

    if (!count || count <= SESSION_CAP_THRESHOLD) return;

    const { data: oldest } = await admin
      .from("analytics_sessions")
      .select("id")
      .order("started_at", { ascending: true })
      .limit(SESSION_CLEANUP_BATCH);

    const idsToDelete = (oldest ?? []).map((s) => s.id);
    if (idsToDelete.length === 0) return;

    await admin.from("analytics_pageviews").delete().in("session_id", idsToDelete);
    await admin.from("analytics_conversions").delete().in("session_id", idsToDelete);
    await admin.from("analytics_sessions").delete().in("id", idsToDelete);
  } catch {
    // اگر پاکسازی خطا بده، نباید مانع ثبت بازدید بشه
  }
}