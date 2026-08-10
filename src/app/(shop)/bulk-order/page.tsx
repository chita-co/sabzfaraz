import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BulkOrderForm from "@/components/shop/BulkOrderForm";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const metadata = { title: "سفارش جمعی از بازار | سبزفراز" };

export default async function BulkOrderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/bulk-order");

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "سفارش جمعی از بازار" }]} />
      </div>
      <BulkOrderForm />
    </>
  );
}