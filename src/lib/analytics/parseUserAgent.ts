export interface ParsedUserAgent {
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string;
  browserVersion: string;
  os: string;
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  const s = ua || "";

  let deviceType: ParsedUserAgent["deviceType"] = "desktop";
  if (/iPad|Android(?!.*Mobile)|Tablet|Kindle|PlayBook/i.test(s)) {
    deviceType = "tablet";
  } else if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry/i.test(s)) {
    deviceType = "mobile";
  }

  let os = "Unknown";
  if (/Windows NT 10/i.test(s)) os = "Windows 10/11";
  else if (/Windows NT/i.test(s)) os = "Windows";
  else if (/Mac OS X/i.test(s)) os = "macOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS";
  else if (/Linux/i.test(s)) os = "Linux";

  let browser = "Unknown";
  let browserVersion = "";
  const edgeMatch = s.match(/Edg\/([\d.]+)/);
  const operaMatch = s.match(/OPR\/([\d.]+)/);
  const chromeMatch = s.match(/Chrome\/([\d.]+)/);
  const firefoxMatch = s.match(/Firefox\/([\d.]+)/);
  const safariMatch = s.match(/Version\/([\d.]+).*Safari/);

  if (edgeMatch) { browser = "Edge"; browserVersion = edgeMatch[1]; }
  else if (operaMatch) { browser = "Opera"; browserVersion = operaMatch[1]; }
  else if (firefoxMatch) { browser = "Firefox"; browserVersion = firefoxMatch[1]; }
  else if (chromeMatch) { browser = "Chrome"; browserVersion = chromeMatch[1]; }
  else if (safariMatch) { browser = "Safari"; browserVersion = safariMatch[1]; }

  return { deviceType, browser, browserVersion, os };
}