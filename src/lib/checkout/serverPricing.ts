// src/lib/checkout/serverPricing.ts
// قیمت‌گذاری امن سمت سرور: قیمت، تعداد معتبر و هزینه‌ی ارسال از دیتابیس خوانده می‌شود،
// نه از مقداری که مرورگر می‌فرستد. منطق محاسبه دقیقاً همان منطق فعلی سایت است
// (قیمت پلکانی ← قیمت با تخفیف ← قیمت اصلی / قیمت سفارش چین / ارسال بر اساس وزن).
import { createAdminClient } from "@/lib/supabase/admin";

type InputItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  discountPrice: number | null;
  quantity: number;
  isChinaOrder?: boolean;
};

type Tier = { product_id: string; min_qty: number; max_qty: number; unit_price: number };

export async function priceCheckoutItems<T extends InputItem>(
  items: T[],
  shippingMethodId: string | null
): Promise<{ error: string } | { items: T[]; shippingCost: number }> {
  if (!Array.isArray(items) || items.length === 0) return { error: "سبد خرید شما خالی است." };
  if (items.length > 100) return { error: "تعداد اقلام سبد خرید بیش از حد مجاز است." };
  if (!shippingMethodId) return { error: "لطفاً یک روش ارسال انتخاب کنید." };

  const admin = createAdminClient();
  const ids = [...new Set(items.map((i) => String(i.productId)))];

  const [productsRes, tiersRes, methodRes, shipTiersRes] = await Promise.all([
    admin
      .from("products")
      .select("id, name, images, price, discount_price, china_price, fulfillment_type, weight_grams, is_sold_by_unit, stock")
      .in("id", ids),
    admin.from("product_quantity_tiers").select("product_id, min_qty, max_qty, unit_price").in("product_id", ids),
    admin.from("shipping_methods").select("id").eq("id", shippingMethodId).eq("is_active", true).maybeSingle(),
    admin
      .from("shipping_weight_tiers")
      .select("min_weight_grams, max_weight_grams, cost")
      .eq("method_id", shippingMethodId)
      .order("min_weight_grams", { ascending: true }),
  ]);

  if (productsRes.error || tiersRes.error || shipTiersRes.error) {
    return { error: "خطا در دریافت قیمت‌ها. لطفاً دوباره تلاش کنید." };
  }
  if (!methodRes.data) return { error: "روش ارسال انتخابی معتبر نیست." };

  const products = new Map((productsRes.data ?? []).map((p) => [p.id as string, p]));
  const tiers = (tiersRes.data ?? []) as Tier[];

  let totalWeight = 0;
  const safeItems: T[] = [];

  for (const item of items) {
    const product = products.get(String(item.productId));
    if (!product) return { error: "یکی از محصولات سبد خرید دیگر موجود نیست. لطفاً سبد را بررسی کنید." };

    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 100000) {
      return { error: "تعداد یکی از اقلام سبد خرید معتبر نیست." };
    }
    if (!product.is_sold_by_unit && !Number.isInteger(qty)) {
      return { error: "تعداد یکی از اقلام سبد خرید معتبر نیست." };
    }

    let price: number;
    let discountPrice: number | null;

    if (item.isChinaOrder) {
      const okType = product.fulfillment_type === "CHINA_ORDER" || product.fulfillment_type === "BOTH";
      if (!okType || !product.china_price || product.china_price <= 0) {
        return { error: "سفارش چین برای یکی از محصولات سبد فعال نیست." };
      }
      price = Number(product.china_price);
      discountPrice = null;
    } else {
      // موجودی: stock برابر null یعنی نامحدود. فقط بررسی می‌کنیم؛ کسر موجودی همان‌جای قبلی انجام می‌شود.
      if (typeof product.stock === "number" && qty > product.stock) {
        return {
          error:
            product.stock <= 0
              ? `محصول «${product.name}» ناموجود شده است. لطفاً آن را از سبد خرید حذف کنید.`
              : `موجودی محصول «${product.name}» کافی نیست. موجودی فعلی: ${product.stock}`,
        };
      }
      const tier = tiers.find(
        (t) => t.product_id === product.id && qty >= Number(t.min_qty) && qty <= Number(t.max_qty)
      );
      price = Number(product.price);
      discountPrice = tier ? Number(tier.unit_price) : product.discount_price ?? null;
    }

    const unit = discountPrice ?? price;
    if (!Number.isFinite(unit) || unit <= 0) {
      return { error: "قیمت یکی از محصولات سبد خرید معتبر نیست." };
    }

    totalWeight += Number(product.weight_grams ?? 0) * qty;

    safeItems.push({
      ...item,
      name: product.name,
      image: product.images?.[0] ?? "",
      price,
      discountPrice,
      quantity: qty,
    });
  }

  const shipTiers = shipTiersRes.data ?? [];
  let shippingCost = 0;
  if (shipTiers.length > 0) {
    const matched = shipTiers.find(
      (t) => totalWeight >= Number(t.min_weight_grams) && totalWeight <= Number(t.max_weight_grams)
    );
    shippingCost = Number((matched ?? shipTiers[shipTiers.length - 1]).cost);
  }

  return { items: safeItems, shippingCost };
}
