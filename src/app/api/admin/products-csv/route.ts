import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// نوع دقیق برای محصولات دریافتی
type ProductCsvRow = {
  name: string;
  sku: string;
  price: number;
  discount_price: number | null;
  stock: number | null;
  weight_grams: number | null;
  is_active: boolean;
  category: { name: string } | null;
};

export async function GET() {
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

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });

  const header = [
    "نام",
    "کد محصول",
    "دسته‌بندی",
    "قیمت",
    "قیمت تخفیف",
    "موجودی",
    "وزن (گرم)",
    "وضعیت",
  ];
  const rows = (products as ProductCsvRow[] ?? []).map((p) => [
    p.name,
    p.sku,
    p.category?.name ?? "",
    p.price,
    p.discount_price ?? "",
    p.stock ?? "نامحدود",
    p.weight_grams ?? "",
    p.is_active ? "فعال" : "غیرفعال",
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}