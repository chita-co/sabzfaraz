"use server";

import { createClient } from "@/lib/supabase/server";

export async function getActiveBankAccounts() {
  const supabase = await createClient();
  const { data } = await supabase.from("bank_accounts").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
}