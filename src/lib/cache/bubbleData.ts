import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import type { BubbleStockRow } from "@/lib/bubble/stock";
import type { BubbleItem } from "@/components/bubble/types";

const VISIBLE = "partner_id.is.null,partner_approval_status.eq.APPROVED";

export const getHomeBubbleItems = unstable_cache(
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
      .limit(20);

    if (error) throw error;
          const rows = (data ?? []) as unknown as Array<BubbleItem & BubbleStockRow>;
      return rows;
  },
  ["home-bubble"],
  { revalidate: 30, tags: ["products"] }
);