import { createClient } from "@/lib/supabase/server";
import CartClient from "@/components/shop/CartClient";
import AuroraBackground from "@/components/backgrounds/AuroraBackground";

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <>
      <AuroraBackground />
      <div className="relative z-10">
        <CartClient isLoggedIn={!!user} />
      </div>
    </>
  );
}