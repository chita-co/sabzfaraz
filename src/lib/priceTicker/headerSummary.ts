import type { PriceItem, PriceSnapshot } from "@/types/priceTicker";

function findBySymbolOrName(items: PriceItem[], symbolHints: string[], nameHints: string[]): PriceItem | null {
  const bySymbol = items.find((i) => symbolHints.some((h) => i.symbol.toLowerCase() === h.toLowerCase() || i.symbol.toLowerCase().includes(h.toLowerCase())));
  if (bySymbol) return bySymbol;
  const byName = items.find((i) => nameHints.some((h) => i.name.includes(h)));
  return byName ?? null;
}

export interface HeaderPriceSummary {
  usd: PriceItem | null;
  gold18k: PriceItem | null;
  bitcoin: PriceItem | null;
}

export function extractHeaderPrices(snapshot: PriceSnapshot): HeaderPriceSummary {
  const usd = findBySymbolOrName(snapshot.currency, ["price_dollar_rl", "usd"], ["دلار"]);
  const gold18k = findBySymbolOrName(snapshot.gold, ["gold_18k"], ["طلای ۱۸"]);
  const bitcoin = findBySymbolOrName(snapshot.crypto, ["btc"], ["بیت‌کوین", "بیت کوین"]);
  return { usd, gold18k, bitcoin };
}