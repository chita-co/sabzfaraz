export type TierLike = { min_qty: number; max_qty: number; unit_price: number };

export type SplitInput = {
  quantity: number;
  price: number;                   // قیمت اصلی
  regularDiscount: number | null;  // قیمت عادی پایه (در حباب: flash_base_discount_price)
  tiers: TierLike[];               // پلکانی، بر اساس کل تعداد خرید
  flashActive: boolean;
  flashPrice: number | null;       // قیمت حبابی
  flashStock: number | null;       // موجودی باقی‌مانده‌ی حباب
};

export type SplitPart = { qty: number; unit: number; isBubble: boolean };

// خط خرید را به بخش حبابی و بخش عادی تقسیم می‌کند.
// بخش حبابی اول از موجودی حباب برداشته می‌شود؛ مابقی با قیمت عادی (پلکانی بر اساس کل تعداد) حساب می‌شود.
export function splitQuantity(input: SplitInput): SplitPart[] {
  const q = input.quantity;
  const tier = input.tiers.find((t) => q >= t.min_qty && q <= t.max_qty);
  const regularUnit = tier ? tier.unit_price : (input.regularDiscount ?? input.price);

  if (!input.flashActive || input.flashPrice == null) {
    return [{ qty: q, unit: regularUnit, isBubble: false }];
  }

  const bubbleQty = Math.max(0, Math.min(q, input.flashStock ?? 0));
  const regularQty = q - bubbleQty;

  const parts: SplitPart[] = [];
  if (bubbleQty > 0) parts.push({ qty: bubbleQty, unit: input.flashPrice, isBubble: true });
  if (regularQty > 0) parts.push({ qty: regularQty, unit: regularUnit, isBubble: false });
  return parts;
}

export function splitTotal(input: SplitInput): number {
  return splitQuantity(input).reduce((sum, p) => sum + p.qty * p.unit, 0);
}

export type CartLineLike = {
  quantity: number;
  price: number;
  discountPrice: number | null;
  flashPrice?: number | null;
  flashStock?: number | null;
  regularDiscount?: number | null;
  quantityTiers?: TierLike[];
};

// جمع یک خط سبد؛ برای خط‌های بدون حباب همان منطق قبلی است
export function cartItemTotal(line: CartLineLike): number {
  if (line.flashPrice == null) return (line.discountPrice ?? line.price) * line.quantity;
  return splitTotal({
    quantity: line.quantity,
    price: line.price,
    regularDiscount: line.regularDiscount ?? null,
    tiers: line.quantityTiers ?? [],
    flashActive: true,
    flashPrice: line.flashPrice,
    flashStock: line.flashStock ?? 0,
  });
}