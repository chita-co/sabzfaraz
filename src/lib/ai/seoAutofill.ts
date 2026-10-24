// src/lib/ai/seoAutofill.ts
import { callAiWithRotation } from "@/lib/ai/rotatingClient";

export interface SeoFields {
  shortDescription: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
}

export function stripHtml(s: string): string {
  return (s || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function parseJsonLoose(raw: string): Record<string, unknown> {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("پاسخ هوش مصنوعی قابل‌خواندن نبود. دوباره تلاش کنید.");
  try {
    return JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    throw new Error("پاسخ هوش مصنوعی قابل‌خواندن نبود. دوباره تلاش کنید.");
  }
}

export async function generateSeoFields(prompt: string): Promise<SeoFields> {
  const raw = await callAiWithRotation(prompt, "SEQUENTIAL", { temperature: 0.3 });
  const d = parseJsonLoose(raw);
  const str = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

  let tags: string[] = [];
  if (Array.isArray(d.tags)) {
    tags = d.tags.map((t) => str(t, 40)).filter(Boolean);
  } else {
    tags = str(d.tags, 400).split(/[،,]/).map((t) => t.trim()).filter(Boolean);
  }

  return {
    shortDescription: str(d.shortDescription, 300),
    tags: tags.slice(0, 12),
    metaTitle: str(d.metaTitle, 60),
    metaDescription: str(d.metaDescription, 160),
    focusKeyword: str(d.focusKeyword, 60),
  };
}