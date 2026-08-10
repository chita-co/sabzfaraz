import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Breadcrumb from "@/components/shop/Breadcrumb";
import BulkOrderHub from "@/components/shop/BulkOrderHub";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const metadata = { title: "سفارش جمعی از بازار | سبزفراز" };

export default async function BulkOrderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/bulk-order");

  const { data: requests } = await supabase
    .from("bulk_order_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "سفارش جمعی از بازار" }]} />
      </div>
      <BulkOrderHub requests={requests ?? []} />
    </>
  );
}