import { createClient } from "@/lib/supabase/server";
import GeneralSettingsForm from "@/components/admin/GeneralSettingsForm";

export default async function AdminGeneralSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("store_name, support_phone, support_phone_2, support_email, store_address, about_content, min_order_amount, store_postal_code, unboxing_whatsapp_number, unboxing_telegram_id, unboxing_instagram_handle, extra_phones, extra_emails")
    .eq("id", 1)
    .single();

  return (
    <GeneralSettingsForm
      initial={
        data
          ? { ...data, extra_phones: data.extra_phones ?? [], extra_emails: data.extra_emails ?? [] }
          : {
              store_name: "سبزفراز",
              support_phone: null,
              support_phone_2: null,
              support_email: null,
              store_address: null,
              store_postal_code: null,
              about_content: null,
              min_order_amount: 500000,
              unboxing_whatsapp_number: null,
              unboxing_telegram_id: null,
              unboxing_instagram_handle: null,
              extra_phones: [],
              extra_emails: [],
            }
      }
    />
  );
}