import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const [{ data: categories }, { data: products }, { data: orders }, { data: orderItems }] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase.from("products").select("*"),
    supabase.from("orders").select("*"),
    supabase.from("order_items").select("*"),
  ]);

  const backup = {
    generatedAt: new Date().toISOString(),
    categories, products, orders, orderItems,
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sabzfaraz-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}