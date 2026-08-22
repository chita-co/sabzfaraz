export function countryCodeToFlagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return "🏳️";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const COUNTRY_NAMES_FA: Record<string, string> = {
  IR: "ایران", US: "آمریکا", GB: "بریتانیا", DE: "آلمان", FR: "فرانسه",
  TR: "ترکیه", AE: "امارات", CA: "کانادا", AU: "استرالیا", NL: "هلند",
  RU: "روسیه", CN: "چین", IN: "هند", JP: "ژاپن", KR: "کره جنوبی",
  IT: "ایتالیا", ES: "اسپانیا", SE: "سوئد", CH: "سوئیس", AT: "اتریش",
  IQ: "عراق", AF: "افغانستان", PK: "پاکستان", SA: "عربستان", QA: "قطر",
  KW: "کویت", OM: "عمان", AZ: "آذربایجان", AM: "ارمنستان", TM: "ترکمنستان",
  UA: "اوکراین", PL: "لهستان", FI: "فنلاند", NO: "نروژ", DK: "دانمارک",
  BR: "برزیل", MX: "مکزیک", SG: "سنگاپور", MY: "مالزی", ID: "اندونزی",
};

export function getCountryNameFa(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  return COUNTRY_NAMES_FA[countryCode.toUpperCase()] ?? countryCode.toUpperCase();
}

const IRAN_CONFUSABLE_COUNTRIES = ["AZ", "AM", "TM", "GE", "IQ", "AE"];

export function refineGuestCountry(countryCode: string | null, acceptLanguageHeader: string): string | null {
  if (!countryCode) return countryCode;
  const isPersianBrowser = /fa(-IR)?/i.test(acceptLanguageHeader);
  if (IRAN_CONFUSABLE_COUNTRIES.includes(countryCode.toUpperCase()) && isPersianBrowser) {
    return "IR";
  }
  return countryCode;
}