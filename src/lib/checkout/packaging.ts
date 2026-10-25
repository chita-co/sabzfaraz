// محاسبه‌ی هزینه‌ی بسته‌بندی بر اساس وزن سفارش (گرم) و بازه‌های پنل ادمین.
// عمداً هیچ import سروری ندارد تا هم کلاینت و هم سرور از همین یک منطق استفاده کنند.
export type PackagingTier = {
  min_weight_grams: number;
  max_weight_grams: number;
  cost: number;
};

export function calcPackagingCost(tiers: PackagingTier[] | null | undefined, weightGrams: number): number {
  if (!tiers || tiers.length === 0) return 0;
  const sorted = [...tiers].sort((a, b) => Number(a.min_weight_grams) - Number(b.min_weight_grams));
  const w = Number(weightGrams) || 0;
  const matched = sorted.find(
    (t) => w >= Number(t.min_weight_grams) && w <= Number(t.max_weight_grams)
  );
  // مثل منطق ارسال: اگر وزن از آخرین بازه بیشتر باشد، هزینه‌ی آخرین بازه اعمال می‌شود
  return Number((matched ?? sorted[sorted.length - 1]).cost) || 0;
}