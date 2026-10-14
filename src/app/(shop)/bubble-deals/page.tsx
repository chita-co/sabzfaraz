import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import type { BubbleStockRow } from "@/lib/bubble/stock";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";
import BubbleDealsGrid from "@/components/bubble/BubbleDealsGrid";
import type { BubbleItem } from "@/components/bubble/types";

export const metadata: Metadata = {
  title: "حباب ارزانی | سبزفراز",
  description: "قیمت‌های ویژه و محدود به زمان در حباب ارزانی سبزفراز",
  alternates: { canonical: "/bubble-deals" },
};

const VISIBLE = "partner_id.is.null,partner_approval_status.eq.APPROVED";

const getBubbleDeals = unstable_cache(
  async (): Promise<BubbleItem[]> => {
    await createAdminClient().rpc("refresh_bubble_deals");

    const { data, error } = await createPublicClient()
      .from("products")
      .select(
        "id, name, slug, images, price, discount_price, stock, flash_stock, flash_ends_at, colors, sizes, weight_grams, is_sold_by_unit, unit_label, has_min_order_quantity, min_order_quantity, flash_applied, flash_price, flash_stock, flash_base_discount_price"
      )
      .eq("is_active", true)
      .eq("flash_applied", true)
      .gt("flash_ends_at", new Date().toISOString())
      .or(VISIBLE)
      .order("flash_ends_at", { ascending: true })
      .limit(60);

    if (error) throw error;
    const rows = (data ?? []) as unknown as Array<BubbleItem & BubbleStockRow>;
      return rows;
  },
  ["bubble-deals"],
  { revalidate: 30, tags: ["products"] }
);

export default async function BubbleDealsPage() {
  const items = await getBubbleDeals();

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumb theme="dark" items={[{ label: "حباب ارزانی" }]} />
        <header className="bubble-hero">
          <h1>🫧 حباب ارزانی</h1>
          <p>قیمت‌های ویژه‌ی محدود به زمان؛ تا وقتی حباب‌ها نترکیده‌اند!</p>
        </header>
        <BubbleDealsGrid items={items} />
      </div>
    </>
  );
}