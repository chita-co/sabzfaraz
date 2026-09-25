import { createClient } from "@/lib/supabase/server";
import TorobSettingsForm from "@/components/admin/TorobSettingsForm";

export default async function AdminTorobSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("torob_order_tracking_enabled")
    .eq("id", 1)
    .single();

  return <TorobSettingsForm enabled={settings?.torob_order_tracking_enabled ?? false} />;
}