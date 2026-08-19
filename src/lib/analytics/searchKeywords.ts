interface EngineConfig {
  hostFragment: string;
  queryParam: string;
  displayName: string;
}

const SEARCH_ENGINES: EngineConfig[] = [
  { hostFragment: "google.", queryParam: "q", displayName: "گوگل" },
  { hostFragment: "bing.", queryParam: "q", displayName: "بینگ" },
  { hostFragment: "yahoo.", queryParam: "p", displayName: "یاهو" },
  { hostFragment: "duckduckgo.", queryParam: "q", displayName: "داک‌داک‌گو" },
  { hostFragment: "yandex.", queryParam: "text", displayName: "یاندکس" },
  { hostFragment: "baidu.", queryParam: "wd", displayName: "بایدو" },
  { hostFragment: "ecosia.org", queryParam: "q", displayName: "اکوسیا" },
];

export function extractSearchInfo(referrer: string | null): { keywords: string | null; engine: string | null } {
  if (!referrer) return { keywords: null, engine: null };

  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return { keywords: null, engine: null };
  }

  for (const engine of SEARCH_ENGINES) {
    if (url.host.includes(engine.hostFragment)) {
      const keywords = url.searchParams.get(engine.queryParam);
      return { keywords: keywords || null, engine: engine.displayName };
    }
  }

  return { keywords: null, engine: null };
}