"use client";

export async function detectPreferredPlatform(): Promise<"aparat" | "youtube"> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    await fetch("https://www.aparat.com/favicon.ico", { mode: "no-cors", signal: controller.signal });
    clearTimeout(timeout);
    return "aparat";
  } catch {
    return "youtube";
  }
}