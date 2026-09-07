// src/lib/priceTicker/providers/coingecko.ts
import type { PriceItem } from "@/types/priceTicker";

const TOP_CRYPTO_IDS = [
  // ۱۰ ارز قبلی شما با همان ترتیب
  "bitcoin",
  "tether",
  "ethereum",
  "solana",
  "binancecoin",
  "tron",
  "ripple",
  "cardano",
  "the-open-network",
  "dogecoin",

  // ارزهای برتر جدید
  "usd-coin", "staked-ether", "shiba-inu", "avalanche-2", "polkadot", "chainlink",
  "bitcoin-cash", "near", "polygon", "litecoin", "internet-computer", "unus-sed-leo",
  "dai", "ethereum-classic", "fetch-ai", "render-token", "optimism", "arbitrum",
  "injective-protocol", "hedera-hashgraph", "cosmos", "stellar", "okb", "monero",
  "cronos", "kaspa", "mantle", "filecoin", "first-digital-usd", "immutable-x",
  "the-graph", "pepe", "bittensor", "vechain", "maker", "aave", "algorand",
  "quant", "thorchain", "floki", "gala", "flow", "apecoin", "axie-infinity",
  "chiliz", "decentraland", "eos", "tezos", "neo", "iota", "zcash", "dash",
  "elrond-erd-2", "kava", "theta-token", "arweave", "celo", "stacks", "mina",
  "osmosis", "kucoin-shares", "huobi-token", "gatechain-token", "curve-dao-token",
  "frax-share", "loopring", "nexo", "pancakeswap-token", "compound", "yearn-finance",
  "woo-network", "1inch", "basic-attention-token", "enjincoin", "holotoken", "ravencoin",
  "ontology", "nano", "harmony", "zelcash", "sushi", "convex-finance", "rocket-pool",
  "illuvium", "stepn", "jito", "bonk", "dogwifcoin", "popcat", "worldcoin",
  "ondo-finance", "celestia", "sui", "sei", "aptos", "opulus", "metis-token",
  "zksync", "blast", "dymension", "eigenlayer", "puffer-finance", "aioz-network",
  "helium", "wemix", "galxe", "dexe", "akash-network", "casper-network", "aelf",
  "skale", "oasis-network"
];


const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
  TOP_CRYPTO_IDS.join(",") +
  "&order=market_cap_desc&price_change_percentage=24h&sparkline=false";

const FETCH_TIMEOUT_MS = 8000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // ۶ ساعت

// ترتیب دلخواه نمایش
const COIN_ORDER = TOP_CRYPTO_IDS;

const PERSIAN_NAMES: Record<string, string> = {
  bitcoin: "بیت‌کوین",
  tether: "تتر",
  ethereum: "اتریوم",
  solana: "سولانا",
  binancecoin: "بایننس کوین",
  tron: "ترون",
  ripple: "ریپل",
  cardano: "کاردانو",
  "the-open-network": "تون‌کوین",
  dogecoin: "دوج‌کوین",

  "usd-coin": "یو‌اس‌دی کوین",
  "staked-ether": "استیکد اتریوم",
  "shiba-inu": "شیبا",
  "avalanche-2": "آوالانچ",
  polkadot: "پولکادات",
  chainlink: "چین‌لینک",
  "bitcoin-cash": "بیت‌کوین کش",
  near: "نیر",
  polygon: "پالیگان",
  litecoin: "لایت‌کوین",
  "internet-computer": "اینترنت کامپیوتر",
  "unus-sed-leo": "لئو",
  dai: "دای",
  "ethereum-classic": "اتریوم کلاسیک",
  "fetch-ai": "فچ ای‌آی",
  "render-token": "رندر",
  optimism: "آپتیمیزم",
  arbitrum: "آربیتروم",
  "injective-protocol": "اینجکتیو",
  "hedera-hashgraph": "هدرا",
  cosmos: "کازموس",
  stellar: "استلار",
  okb: "اوکی‌بی",
  monero: "مونرو",
  cronos: "کرونوس",
  kaspa: "کاسپا",
  mantle: "منتل",
  filecoin: "فایل‌کوین",
  "first-digital-usd": "اف‌دی‌یو‌اس‌دی",
  "immutable-x": "ایمیوتبل",
  "the-graph": "گراف",
  pepe: "پپه",
  bittensor: "بیت‌تنسور",
  vechain: "وی‌چین",
  maker: "میکر",
  aave: "آوه",
  algorand: "آلگوراند",
  quant: "کوانت",
  thorchain: "تورچین",
  floki: "فلوکی",
  gala: "گالا",
  flow: "فلو",
  apecoin: "ایپ‌کوین",
  "axie-infinity": "اکسی اینفینیتی",
  chiliz: "چیلیز",
  decentraland: "دسنترالند",
  eos: "ایاس",
  tezos: "تزوس",
  neo: "نئو",
  iota: "آیوتا",
  zcash: "زی‌کش",
  dash: "دش",
  "elrond-erd-2": "الروند",
  kava: "کاوا",
  "theta-token": "تتا",
  arweave: "آرویو",
  celo: "سلو",
  stacks: "استکس",
  mina: "مینا",
  osmosis: "اسموزیس",
  "kucoin-shares": "کوکوین",
  "huobi-token": "هیوبی",
  "gatechain-token": "گیت",
  "curve-dao-token": "کرو",
  "frax-share": "فریکس",
  loopring: "لوپرینگ",
  nexo: "نکسو",
  "pancakeswap-token": "پنکیک",
  compound: "کامپاند",
  "yearn-finance": "یرن",
  "woo-network": "وو",
  "1inch": "وان‌اینچ",
  "basic-attention-token": "بت",
  enjincoin: "انجین",
  holotoken: "هولو",
  ravencoin: "ریون",
  ontology: "آنتولوژی",
  nano: "نانو",
  harmony: "هارمونی",
  zelcash: "زل‌کش",
  sushi: "سوشی",
  "convex-finance": "کانوکس",
  "rocket-pool": "راکت پول",
  illuvium: "ایلویوم",
  stepn: "استپن",
  jito: "جیتو",
  bonk: "بونک",
  dogwifcoin: "داگ‌ویف",
  popcat: "پاپ‌کت",
  worldcoin: "ورلدکوین",
  "ondo-finance": "اوندو",
  celestia: "سلستیا",
  sui: "سویی",
  sei: "سی",
  aptos: "آپتوس",
  opulus: "اپولوس",
  "metis-token": "متیس",
  zksync: "زی‌کی سینک",
  blast: "بلاست",
  dymension: "دایمنشن",
  eigenlayer: "ایگن‌لیر",
  "puffer-finance": "پافر",
  "aioz-network": "ای‌آی‌اوزد",
  helium: "هلیوم",
  wemix: "ومیکس",
  galxe: "گلکسی",
  dexe: "دکس",
  "akash-network": "آکاش",
  "casper-network": "کاسپر",
  aelf: "الف",
  skale: "اسکیل",
  "oasis-network": "اوئیسیس",
};

interface CoinGeckoEntry {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  total_volume: number;
  market_cap: number;
  market_cap_rank: number;
  image?: string;
  last_updated?: string;
}

export async function fetchCrypto(usdToTomanRate: number): Promise<PriceItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(COINGECKO_URL, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: CoinGeckoEntry[] = await res.json();
    if (!Array.isArray(json) || json.length === 0) throw new Error("پاسخ CoinGecko خالی بود");

    // فیلتر تازگی و ساخت آیتم‌ها
    const items: PriceItem[] = [];
    for (const c of json) {
      const lastUpdated = c.last_updated ? new Date(c.last_updated).getTime() : null;
      if (!lastUpdated || isNaN(lastUpdated) || Date.now() - lastUpdated > MAX_AGE_MS) {
        continue; // حذف آیتم‌های قدیمی
      }

      items.push({
        symbol: c.symbol.toUpperCase(),
        name: PERSIAN_NAMES[c.id] || c.name,
        nameEn: c.name,
        usdPrice: c.current_price,
        price: usdToTomanRate > 0 ? Math.round(c.current_price * usdToTomanRate) : 0,
        changeValue: 0,
        changePercent: c.price_change_percentage_24h ?? 0,
        unit: "تومان",
        volume24h: c.total_volume,
        marketCap: c.market_cap,
        rank: c.market_cap_rank,
        icon: c.image,
      });
    }

    // مرتب‌سازی بر اساس ترتیب دلخواه
    items.sort((a, b) => {
      const indexA = COIN_ORDER.findIndex((id) => PERSIAN_NAMES[id] === a.name);
      const indexB = COIN_ORDER.findIndex((id) => PERSIAN_NAMES[id] === b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return items;
  } catch (err) {
    clearTimeout(timeout);
    throw err instanceof Error ? err : new Error("دریافت قیمت ارز دیجیتال از CoinGecko ناموفق بود");
  }
}