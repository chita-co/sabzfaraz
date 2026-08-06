const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /googlebot/i, /bingbot/i, /yandexbot/i,
  /baiduspider/i, /duckduckbot/i, /facebookexternalhit/i, /twitterbot/i, /slackbot/i,
  /linkedinbot/i, /whatsapp/i, /telegrambot/i, /ahrefsbot/i, /semrushbot/i, /mj12bot/i,
  /petalbot/i, /python-requests/i, /curl\//i, /wget\//i, /headlesschrome/i, /phantomjs/i,
  /lighthouse/i, /pingdom/i, /uptimerobot/i, /vercel-screenshot/i, /prerender/i,
];

export function isBotUserAgent(ua: string): boolean {
  if (!ua) return true;
  return BOT_PATTERNS.some((re) => re.test(ua));
}