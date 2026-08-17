"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateGeneralSettings(formData: FormData) {
  const supabase = await createClient();

  const extraPhones = (formData.getAll("extraPhones") as string[]).map((p) => p.trim()).filter(Boolean);
  const extraEmails = (formData.getAll("extraEmails") as string[]).map((e) => e.trim()).filter(Boolean);

  const { error } = await supabase
    .from("site_settings")
    .update({
      store_name: formData.get("storeName") as string,
      support_phone: formData.get("supportPhone") as string,
      support_email: formData.get("supportEmail") as string,
      store_address: formData.get("storeAddress") as string,
      about_content: formData.get("aboutContent") as string,
      min_order_amount: Number(formData.get("minOrderAmount")) || 0,
      support_phone_2: (formData.get("supportPhone2") as string) || null,
      store_postal_code: (formData.get("storePostalCode") as string) || null,
      unboxing_whatsapp_number: (formData.get("unboxingWhatsapp") as string) || null,
      unboxing_telegram_id: (formData.get("unboxingTelegram") as string) || null,
      unboxing_instagram_handle: (formData.get("unboxingInstagram") as string) || null,
      extra_phones: extraPhones,
      extra_emails: extraEmails,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/contact");
  revalidatePath("/about");
  return { success: true };
}