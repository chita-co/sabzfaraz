import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "@/components/shop/CheckoutClient";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/checkout");

  const [{ data: addresses }, { data: methods }, { data: tiers }] = await Promise.all([
    supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("shipping_methods").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("shipping_weight_tiers").select("*"),
  ]);

  return (
    <CheckoutClient
      addresses={addresses ?? []}
      shippingMethods={methods ?? []}
      shippingTiers={tiers ?? []}
    />
  );
}