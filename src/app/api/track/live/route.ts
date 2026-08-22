import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translatePageLabel, extractPathname } from "@/lib/analytics/pageLabels";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const includeAdmin = searchParams.get("includeAdmin") === "true";

  const admin = createAdminClient();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  let query = admin
    .from("analytics_sessions")
    .select("id, visitor_id, exit_page, device_type, browser, traffic_source, ended_at, user_id, is_admin_visit, country_code, country_name, profile:profiles(full_name)")
    .gte("ended_at", fiveMinAgo)
    .eq("is_bot", false)
    .order("ended_at", { ascending: false })
    .limit(50);

  if (!includeAdmin) query = query.eq("is_admin_visit", false);

  const { data } = await query;
  const rowsForLabels = data ?? [];

  const productSlugs = new Set<string>();
  const categorySlugs = new Set<string>();
  for (const s of rowsForLabels) {
    const pathname = extractPathname(s.exit_page || "");
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

  const sessions = rowsForLabels.map((s) => ({ ...s, exit_page_label: translatePageLabel(s.exit_page, productNames, categoryNames) }));

  return NextResponse.json({ sessions });
}