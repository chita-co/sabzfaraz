import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BulkOrderForm from "@/components/shop/BulkOrderForm";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const metadata = { title: "سفارش جمعی از بازار | سبزفراز" };

export default async function BulkOrderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/bulk-order");

  return (
    <>
      <GalaxyBackground />
      <BulkOrderForm />
    </>
  );
}