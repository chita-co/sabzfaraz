import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translatePageLabel, extractPathname } from "@/lib/analytics/pageLabels";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const admin = createAdminClient();
  const [{ data: session }, { data: pageviews }, { data: conversions }] = await Promise.all([
    admin.from("analytics_sessions").select("*, profile:profiles(full_name, phone)").eq("id", id).single(),
    admin.from("analytics_pageviews").select("*").eq("session_id", id).order("viewed_at", { ascending: true }),
    admin.from("analytics_conversions").select("*").eq("session_id", id),
  ]);

  const rawPageviews = pageviews ?? [];
  const productSlugs = new Set<string>();
  const categorySlugs = new Set<string>();
  for (const pv of rawPageviews) {
    const pathname = extractPathname(pv.page_url || "");
    const pMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (pMatch) productSlugs.add(pMatch[1]);
    const cMatch = pathname.match(/^\/category\/([^/]+)$/);
    if (cMatch) categorySlugs.add(cMatch[1]);
  }
  const productNames = new Map<string, string>();
  const categoryNames = new Map<string, string>();
  if (productSlugs.size > 0) {
    const { data: productsData } = await admin.from("products").select("slug, name").in("slug", Array.from(productSlugs));
    for (const p of productsData ?? []) productNames.set(p.slug, p.name);
  }
  if (categorySlugs.size > 0) {
    const { data: categoriesData } = await admin.from("categories").select("slug, name").in("slug", Array.from(categorySlugs));
    for (const c of categoriesData ?? []) categoryNames.set(c.slug, c.name);
  }

  const translatedPageviews = rawPageviews.map((pv) => ({ ...pv, page_label: translatePageLabel(pv.page_url, productNames, categoryNames) }));

  return NextResponse.json({ session, pageviews: translatedPageviews, conversions: conversions ?? [] });
}