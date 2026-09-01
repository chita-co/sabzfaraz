import { getMyAllowedCategoriesAction } from "../actions";
import PartnerProductForm from "@/components/partner/PartnerProductForm";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function NewPartnerProductPage() {
  const categories = (await getMyAllowedCategoriesAction()) as { id: string; name: string }[];
  const admin = createAdminClient();
  const { data: settings } = await admin.from("partner_settings").select("frame_template_url, frame_center_x, frame_center_y, frame_center_width, frame_center_height, frame_output_size").eq("id", 1).single();

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>ثبت محصول جدید</h1>
      <PartnerProductForm mode="create" categories={categories} frameConfig={settings ? {
        frameUrl: settings.frame_template_url ?? "",
        centerX: settings.frame_center_x, centerY: settings.frame_center_y,
        centerWidth: settings.frame_center_width, centerHeight: settings.frame_center_height,
        outputSize: settings.frame_output_size,
      } : null} />
    </div>
  );
}