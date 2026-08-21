import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

function parseSlugFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("products");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    // اگر URL نسبی بود، به‌صورت دستی اسلاگ را جدا کن
    const match = url.match(/\/products\/([^/]+)/);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "request body is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // ===== حالت ۱: دریافت اطلاعات چند محصول با page_urls =====
  if (Array.isArray(body.page_urls) && body.page_urls.length > 0) {
    const slugs = body.page_urls
      .map((url: string) => parseSlugFromUrl(url))
      .filter((s: string | null): s is string => !!s);

    if (slugs.length === 0) {
      return NextResponse.json({ error: "invalid page_urls" }, { status: 400 });
    }

    const { data: products } = await supabase
      .from("products")
      .select("*, category:categories!products_category_id_fkey(name)")
      .eq("is_active", true)
      .in("slug", slugs);

    return buildTorobResponse(products ?? [], 1, products?.length ?? 0, 1);
  }

  // ===== حالت ۲: دریافت اطلاعات چند محصول با page_uniques =====
  if (Array.isArray(body.page_uniques) && body.page_uniques.length > 0) {
    const uniques: string[] = body.page_uniques;

    const { data: products } = await supabase
      .from("products")
      .select("*, category:categories!products_category_id_fkey(name)")
      .eq("is_active", true)
      .in("sku", uniques);

    return buildTorobResponse(products ?? [], 1, products?.length ?? 0, 1);
  }

  // ===== حالت ۳: دریافت لیست صفحه‌بندی‌شده با page و sort =====
  if (body.page !== undefined && body.sort !== undefined) {
    const page = Number(body.page);
    const sort = body.sort;

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: "page must be a positive integer" }, { status: 400 });
    }

    if (sort !== "date_added_desc" && sort !== "date_updated_desc") {
      return NextResponse.json({ error: "sort parameter is not valid" }, { status: 400 });
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("products")
      .select("*, category:categories!products_category_id_fkey(name)", { count: "exact" })
      .eq("is_active", true);

    if (sort === "date_added_desc") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("updated_at", { ascending: false });
    }

    const { data: products, count } = await query.range(from, to);

    const total = count ?? 0;
    const maxPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return buildTorobResponse(products ?? [], page, total, maxPages);
  }

  // ===== هیچ پارامتر معتبری ارسال نشده =====
  return NextResponse.json(
    { error: "no valid parameters provided" },
    { status: 400 }
  );
}

interface TorobProductRow {
  id: string;
  sku: string | null;
  slug: string;
  name: string;
  name_en: string | null;
  price: number;
  discount_price: number | null;
  stock: number | null;
  images: string[];
  short_description: string | null;
  created_at: string;
  updated_at: string;
  category: { name: string } | null;
}

function buildTorobResponse(
  products: TorobProductRow[],
  currentPage: number,
  total: number,
  maxPages: number
) {
  const mapped = products.map((p) => {
    const categoryName = p.category?.name ?? "";
    const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    const currentPrice = p.discount_price ?? p.price;
    const oldPrice = p.discount_price ? p.price : null;
    const availability = p.stock === null || p.stock > 0;

    return {
      page_unique: p.sku ?? p.id,
      page_url: `https://sabzfaraz.ir/products/${p.slug}`,
      product_group_id: p.id,
      title: p.name,
      subtitle: p.name_en ?? null,
      current_price: currentPrice,
      old_price: oldPrice,
      availability,
      category_name: categoryName,
      image_links: images,
      short_desc: p.short_description ?? null,
      spec: {}, // ویژگی‌های فنی در صورت نیاز بعداً اضافه می‌شود
      guarantee: null, // گارانتی نداریم
      date_added: p.created_at,
      date_updated: p.updated_at,
    };
  });

  return NextResponse.json({
    api_version: "torob_api_v3",
    current_page: currentPage,
    total,
    max_pages: maxPages,
    products: mapped,
  });
}