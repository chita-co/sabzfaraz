import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ count: 0 });

  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("payment_method", ["CARD_TO_CARD", "SHEBA"])
    .eq("payment_status", "AWAITING_CONFIRMATION")
    .is("deleted_at", null);

  return NextResponse.json({ count: count ?? 0 });
}