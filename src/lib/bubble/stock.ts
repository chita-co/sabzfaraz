export type BubbleStockRow = { stock: number | null; flash_stock: number | null };

// موجودی قابل فروش حباب = کمترِ «موجودی حباب» و «موجودی کل محصول»
export function effectiveBubbleStock(row: { stock: number | null; flash_stock?: number | null }) {
  const fs = row.flash_stock ?? null;
  if (fs === null) return row.stock;
  if (row.stock === null) return fs;
  return Math.min(fs, row.stock);
}