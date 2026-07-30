"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTrackingSettings(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      tracking_stage_1: formData.get("stage1") as string,
      tracking_stage_2: formData.get("stage2") as string,
      tracking_stage_3: formData.get("stage3") as string,
      tracking_stage_4: formData.get("stage4") as string,
      tracking_stage_5: formData.get("stage5") as string,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/admin/tracking-settings");
  return { success: true };
}