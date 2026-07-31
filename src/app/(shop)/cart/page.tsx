import { createClient } from "@/lib/supabase/server";
import CartClient from "@/components/shop/CartClient";
import AuroraBackground from "@/components/backgrounds/AuroraBackground";

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: settings } = await supabase.from("site_settings").select("min_order_amount").eq("id", 1).single();

  return (
    <>
      <AuroraBackground />
      <div className="relative z-10">
        <CartClient isLoggedIn={!!user} minOrderAmount={settings?.min_order_amount ?? 500000} />
      </div>
    </>
  );
}