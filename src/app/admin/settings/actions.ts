"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateGeneralSettings(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      store_name: formData.get("storeName") as string,
      support_phone: formData.get("supportPhone") as string,
      support_email: formData.get("supportEmail") as string,
      store_address: formData.get("storeAddress") as string,
      about_content: formData.get("aboutContent") as string,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/contact");
  revalidatePath("/about");
  return { success: true };
}