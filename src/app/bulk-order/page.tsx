import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BulkOrderForm from "@/components/shop/BulkOrderForm";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const metadata = { title: "سفارش جمعی از بازار | سبزفراز" };

export default async function BulkOrderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/bulk-order");

  const [{ data: addresses }, { data: bankAccounts }, { data: settings }] = await Promise.all([
    supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("bank_accounts").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("site_settings").select("bulk_order_fee_type, bulk_order_fee_value").eq("id", 1).single(),
  ]);

  return (
    <>
      <GalaxyBackground />
      <BulkOrderForm
        addresses={addresses ?? []}
        bankAccounts={bankAccounts ?? []}
        feeType={settings?.bulk_order_fee_type ?? "percent"}
        feeValue={settings?.bulk_order_fee_value ?? 10}
      />
    </>
  );
}