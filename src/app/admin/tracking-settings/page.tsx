import { createClient } from "@/lib/supabase/server";
import TrackingSettingsForm from "@/components/admin/TrackingSettingsForm";

export default async function AdminTrackingSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("tracking_stage_1, tracking_stage_2, tracking_stage_3, tracking_stage_4, tracking_stage_5")
    .eq("id", 1)
    .single();

  return (
    <TrackingSettingsForm
      initial={
        data ?? {
          tracking_stage_1: "", tracking_stage_2: "", tracking_stage_3: "",
          tracking_stage_4: "", tracking_stage_5: "",
        }
      }
    />
  );
}