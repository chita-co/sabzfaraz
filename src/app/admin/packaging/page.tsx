import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import PackagingTiersManager from "@/components/admin/PackagingTiersManager";

export const dynamic = "force-dynamic";

export default async function AdminPackagingPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: tiers } = await admin
    .from("packaging_weight_tiers")
    .select("id, min_weight_grams, max_weight_grams, cost")
    .order("min_weight_grams", { ascending: true });

  return <PackagingTiersManager tiers={tiers ?? []} />;
}