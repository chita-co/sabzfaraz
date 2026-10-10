"use server";

import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";

// فقط محصولات فعال و (اگر همکار است) تأییدشده
const VISIBLE = "partner_id.is.null,partner_approval_status.eq.APPROVED";

// محدودیت ساده‌ی تعداد درخواست برای هر IP (در حافظه‌ی سرور؛ سرور پارس‌پک یک پروسه‌ی دائمی است)
const hits = new Map<string, { count: number; resetAt: number }>();
const LIMIT_PER_MINUTE = 40;

function allowed(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || rec.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    return true;
  }
  rec.count += 1;
  return rec.count <= LIMIT_PER_MINUTE;
}

export interface CompareSuggestion {
  slug: string;
  name: string;
  image: string | null;
}

// جست‌وجوی نام محصول برای فرم مقایسه (فقط خواندن؛ هیچ داده‌ای تغییر نمی‌کند)
export async function searchCompareProducts(query: string): Promise<CompareSuggestion[]> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (!allowed(ip)) return [];

  // پاک‌سازی ورودی: طول، کاراکترهای خاص LIKE و جداکننده‌های فیلتر، تعداد کلمات
  const cleaned = String(query ?? "").slice(0, 60).replace(/[\\%_,()]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length < 2) return [];
  const words = cleaned.split(" ").slice(0, 5);

  let q = createPublicClient()
    .from("products")
    .select("name, slug, images")
    .eq("is_active", true)
    .or(VISIBLE);
  for (const w of words) q = q.ilike("name", `%${w}%`);
  const { data } = await q.order("name").limit(8);

  return (data ?? []).map((p) => ({
    slug: p.slug as string,
    name: p.name as string,
    image: Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null,
  }));
}