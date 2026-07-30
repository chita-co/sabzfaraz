import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "@/components/shop/CheckoutClient";
import LightfallBackground from "@/components/backgrounds/LightfallBackground";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/checkout");

  const [{ data: addresses }, { data: shippingRates }, { data: settings }] = await Promise.all([
    supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("shipping_rates").select("*"),
    supabase.from("site_settings").select("default_shipping_cost").eq("id", 1).single(),
  ]);

  return (
   <>
    <LightfallBackground />
    <CheckoutClient
      addresses={addresses ?? []}
      shippingRates={shippingRates ?? []}
      defaultShippingCost={settings?.default_shipping_cost ?? 0}
    />
   </>
  );
}