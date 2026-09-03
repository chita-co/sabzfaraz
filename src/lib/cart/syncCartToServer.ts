"use server";

import { createClient } from "@/lib/supabase/server";

interface SyncCartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  discountPrice: number | null;
  selectedColor: string | null;
  selectedSize: string | null;
  quantity: number;
}

export async function syncCartToServer(items: SyncCartItem[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // فقط برای کاربران واردشده ذخیره می‌شود

  if (items.length === 0) {
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    return;
  }

  const keys = items.map((i) => `${i.productId}|${i.selectedColor ?? ""}|${i.selectedSize ?? ""}`);

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, product_id, selected_color, selected_size")
    .eq("user_id", user.id);

  const toDelete = (existing ?? [])
    .filter((row) => !keys.includes(`${row.product_id}|${row.selected_color}|${row.selected_size}`))
    .map((r) => r.id);
  if (toDelete.length > 0) await supabase.from("cart_items").delete().in("id", toDelete);

  await supabase.from("cart_items").upsert(
    items.map((i) => ({
      user_id: user.id,
      product_id: i.productId,
      product_name: i.name,
      product_image: i.image,
      price: i.price,
      discount_price: i.discountPrice,
      selected_color: i.selectedColor ?? "",
      selected_size: i.selectedSize ?? "",
      quantity: i.quantity,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,product_id,selected_color,selected_size" }
  ).then(({ error }) => {
    if (error) console.error("خطا در sync سبد خرید:", error.message);
  });
}