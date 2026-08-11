import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BulkOrderForm from "@/components/shop/BulkOrderForm";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const metadata = { title: "سفارش جمعی جدید | سبزفراز" };

export default async function NewBulkOrderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/bulk-order/new");

  const { data: addresses } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "سفارش جمعی", href: "/bulk-order" }, { label: "سفارش جدید" }]} />
      </div>
      <BulkOrderForm addresses={addresses ?? []} />
    </>
  );
}