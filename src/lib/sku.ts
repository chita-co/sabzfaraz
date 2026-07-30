export function buildProductCode(
  categorySlug: string,
  productSlug: string,
  price: number
): string {
  const categoryLetter = (categorySlug[0] || "x").toUpperCase();
  const clean = productSlug.replace(/[^a-zA-Z0-9]/g, "");
  const firstLetter = (clean[0] || "x").toLowerCase();
  const lastLetter = (clean[clean.length - 1] || "x").toLowerCase();
  const priceCode = Math.max(1, Math.round(price / 1000));
  return `${categoryLetter}${firstLetter}${lastLetter}${priceCode}`;
}