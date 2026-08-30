import { createAdminClient } from "@/lib/supabase/admin";
import type { PartnerSettings } from "@/types/partner";

export async function getPartnerSettings(): Promise<PartnerSettings> {
  const admin = createAdminClient();
  const { data } = await admin.from("partner_settings").select("*").eq("id", 1).single();
  return data as PartnerSettings;
}