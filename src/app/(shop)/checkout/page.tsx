import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "@/components/shop/CheckoutClient";
import Breadcrumb from "@/components/shop/Breadcrumb";
import { getActivePendingCheckout } from "./pending-actions";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/checkout");

  const [{ data: addresses }, { data: methods }, { data: tiers }, { data: settings }] = await Promise.all([
    supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("shipping_methods").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("shipping_weight_tiers").select("*"),
    supabase.from("site_settings").select("store_name, support_phone, support_phone_2, store_address, logo_url").eq("id", 1).single(),
  ]);

  const phones = [settings?.support_phone, settings?.support_phone_2].filter(Boolean) as string[];

  const pendingResult = await getActivePendingCheckout();

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "سبد خرید", href: "/cart" }, { label: "تکمیل خرید" }]} />
      </div>
      <CheckoutClient
        addresses={addresses ?? []}
        shippingMethods={methods ?? []}
        shippingTiers={tiers ?? []}
        storeInfo={{
          name: settings?.store_name ?? "سبزفراز",
          phones: phones.length > 0 ? phones : ["—"],
          address: settings?.store_address ?? "",
          logoUrl: settings?.logo_url ?? null,
        }}
        pendingCheckout={pendingResult?.expired === false ? pendingResult.pending : null}
        itemsToRestore={pendingResult?.expired === true ? pendingResult.items : null}
      />
    </>
  );
}