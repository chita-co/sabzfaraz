import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CheckoutClient from "@/components/shop/CheckoutClient";
import Breadcrumb from "@/components/shop/Breadcrumb";
import LightfallBackground from "@/components/backgrounds/LightfallBackground";
import BubbleCartWatcher from "@/components/bubble/BubbleCartWatcher";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/checkout");

  const [{ data: addresses }, { data: methods }, { data: tiers }, { data: settings }, { data: bankAccounts }, { data: profile }] = await Promise.all([
    supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("shipping_methods").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("shipping_weight_tiers").select("*"),
    supabase.from("site_settings").select("store_name, support_phone, support_phone_2, store_address, logo_url, support_email, announcement_free_shipping_enabled, announcement_free_shipping_text").eq("id", 1).single(),
    supabase.from("bank_accounts").select("id, bank_name, account_holder_name, card_number, sheba_number, logo_slug").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("wallet_balance").eq("id", user.id).single(),
  ]);

  // بازه‌های وزنی هزینه بسته‌بندی (فقط سمت سرور و با کلاینت ادمین خوانده می‌شود)
  const { data: packagingTiers } = await createAdminClient()
    .from("packaging_weight_tiers")
    .select("min_weight_grams, max_weight_grams, cost")
    .order("min_weight_grams");

  const phones = Array.from(
    new Set(
      [settings?.support_phone, settings?.support_phone_2]
        .filter(Boolean)
        .flatMap((x) => String(x).split(/[-–—]/).map((s) => s.trim()))
        .filter(Boolean)
    )
  ) as string[];

  const freeShippingEnabled = !!settings?.announcement_free_shipping_enabled;
  const visibleMethods = (methods ?? []).filter((m) => !m.is_free_shipping || freeShippingEnabled);

  return (
    <>
      <LightfallBackground />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "سبد خرید", href: "/cart" }, { label: "تکمیل خرید" }]} />
      </div>
      <BubbleCartWatcher />
      <CheckoutClient
        addresses={addresses ?? []}
        shippingMethods={visibleMethods}
        shippingTiers={tiers ?? []}
        packagingTiers={packagingTiers ?? []}
        storeInfo={{
          name: settings?.store_name ?? "سبزفراز",
          phones: phones.length > 0 ? phones : ["—"],
          address: settings?.store_address ?? "",
          logoUrl: settings?.logo_url ?? null,
          email: settings?.support_email ?? null,
        }}
        bankAccounts={bankAccounts ?? []}
        walletBalance={profile?.wallet_balance ?? 0}
        freeShipping={{ enabled: freeShippingEnabled, text: settings?.announcement_free_shipping_text ?? "" }}
      />
    </>
  );
}