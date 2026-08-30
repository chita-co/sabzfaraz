import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Partner } from "@/types/partner";

export async function getCurrentPartner(): Promise<Partner | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: partner } = await supabase.from("partners").select("*").eq("id", user.id).maybeSingle();
  return (partner as Partner) ?? null;
}

// برای Server Actions همکار: اگه فعال نبود پرتاب خطا می‌کنه (نه ریدایرکت، چون داخل اکشنه)
export async function requireActivePartner(): Promise<Partner> {
  const partner = await getCurrentPartner();
  if (!partner) throw new Error("ابتدا وارد پنل همکاران شوید.");
  if (partner.status !== "ACTIVE") throw new Error("حساب همکاری شما هنوز فعال نشده است.");
  return partner;
}

// برای Layout/صفحات: ریدایرکت می‌کنه
export async function requirePartnerForPage(): Promise<Partner> {
  const partner = await getCurrentPartner();
  if (!partner) redirect("/partner/login");
  return partner;
}