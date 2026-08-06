import { createAdminClient } from "@/lib/supabase/admin";

export async function logConversion(sessionKey: string | null, orderId: string, value: number) {
  if (!sessionKey) return;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("analytics_sessions")
    .select("id")
    .eq("session_key", sessionKey)
    .maybeSingle();

  if (!session) return;

  await admin.from("analytics_conversions").insert({
    session_id: session.id,
    event_type: "purchase",
    order_id: orderId,
    value,
  });

  await admin.from("analytics_sessions").update({ is_converted: true }).eq("id", session.id);
}