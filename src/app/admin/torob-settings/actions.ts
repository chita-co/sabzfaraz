"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleTorobOrderTracking(enabled: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ torob_order_tracking_enabled: enabled })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/torob-settings");
  return { success: true };
}