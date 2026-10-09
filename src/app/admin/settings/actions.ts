"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";

export async function updateGeneralSettings(formData: FormData) {
  await requireAdmin();
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


export async function updateAnnouncementSettings(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const text1 = String(formData.get("text1") ?? "").trim().slice(0, 200);
  const text2 = String(formData.get("text2") ?? "").trim().slice(0, 200);

  const { error } = await supabase
    .from("site_settings")
    .update({
      announcement_enabled: formData.get("enabled") === "on",
      announcement_text_1: text1,
      announcement_text_2: text2,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  updateTag("settings"); // کش هدر فوراً تازه شود (وگرنه تا یک ساعت قدیمی می‌ماند)
  revalidatePath("/", "layout");
  return { success: true };
}