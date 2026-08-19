import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PAGE_SIZES = [20, 50, 100];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSizeParam = Number(searchParams.get("pageSize"));
  const pageSize = ALLOWED_PAGE_SIZES.includes(pageSizeParam)
    ? pageSizeParam
    : 20;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "ADMIN")
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  // ✅ رابطه‌ی دقیق برای جلوگیری از ابهام product_categories
  let query = supabase
    .from("products")
    .select("*, category:categories!products_category_id_fkey(name)", {
      count: "exact",
    });

  if (q)
    query = query.or(
      `name.ilike.%${q}%,sku.ilike.%${q}%,name_en.ilike.%${q}%`
    );
  if (category) query = query.eq("category_id", category);
  if (status === "active") query = query.eq("is_active", true);
  else if (status === "inactive") query = query.eq("is_active", false);
  else if (status === "low-stock")
    query = query.not("stock", "is", null).lt("stock", 5).gt("stock", 0);
  else if (status === "out-of-stock") query = query.eq("stock", 0);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data: products, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { products: products ?? [], count: count ?? 0 },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}