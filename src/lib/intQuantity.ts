export function cleanIntInput(raw: string): string {
  return raw.split(/[.,٫]/)[0].replace(/\D/g, "");
}
export function toIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : null;
}
export function minOrderQty(p: { has_min_order_quantity?: boolean | null; min_order_quantity?: number | null }): number {
  if (p.has_min_order_quantity && p.min_order_quantity) {
    return Math.max(1, Math.trunc(Number(p.min_order_quantity)));
  }
  return 1;
}