import type { PriceItem, PriceSnapshot } from "@/types/priceTicker";

function findBySymbolOrName(items: PriceItem[], symbolHints: string[], nameHints: string[]): PriceItem | null {
  const bySymbol = items.find((i) => symbolHints.some((h) => i.symbol.toLowerCase() === h.toLowerCase() || i.symbol.toLowerCase().includes(h.toLowerCase())));
  if (bySymbol) return bySymbol;
  const byName = items.find((i) => nameHints.some((h) => i.name.includes(h)));
  return byName ?? null;
}

function findGold18k(goldItems: PriceItem[]): PriceItem | null {
  // تلاش اول: چند نماد/نام محتمل که معمولاً برای طلای ۱۸ عیار استفاده می‌شود
  const direct = findBySymbolOrName(
    goldItems,
    ["gold_18k", "geram18", "geram_18", "gol18"],
    ["طلای ۱۸", "طلا ۱۸", "طلا۱۸", "۱۸ عیار"]
  );
  if (direct) return direct;

  // فال‌بک هوشمند: هر آیتمی که «طلا» در نامش باشد ولی «سکه»/«نقره» نباشد،
  // و اگر چند مورد بود، آنکه صریحاً به عدد ۱۸ اشاره دارد در اولویت است
  const goldOnly = goldItems.filter((i) => i.name.includes("طلا") && !i.name.includes("سکه") && !i.name.includes("نقره"));
  const with18 = goldOnly.find((i) => i.name.includes("۱۸") || i.name.includes("18"));
  return with18 ?? goldOnly[0] ?? null;
}

export interface HeaderPriceSummary {
  usd: PriceItem | null;
  gold18k: PriceItem | null;
  bitcoin: PriceItem | null;
}

export function extractHeaderPrices(snapshot: PriceSnapshot): HeaderPriceSummary {
  const usd = findBySymbolOrName(snapshot.currency, ["price_dollar_rl", "usd"], ["دلار"]);
  const gold18k = findGold18k(snapshot.gold);
  const bitcoin = findBySymbolOrName(snapshot.crypto, ["btc"], ["بیت‌کوین", "بیت کوین"]);
  return { usd, gold18k, bitcoin };
}