import { createAdminClient } from "@/lib/supabase/admin";

export async function getFreeShippingSettings(): Promise<{ enabled: boolean; text: string }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("announcement_free_shipping_enabled, announcement_free_shipping_text")
    .eq("id", 1)
    .single();
  return {
    enabled: !!data?.announcement_free_shipping_enabled,
    text: data?.announcement_free_shipping_text ?? "",
  };
}