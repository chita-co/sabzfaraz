"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBankAccount(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").insert({
    bank_name: formData.get("bankName") as string,
    account_holder_name: formData.get("accountHolderName") as string,
    card_number: (formData.get("cardNumber") as string) || null,
    sheba_number: (formData.get("shebaNumber") as string) || null,
    logo_slug: (formData.get("logoSlug") as string) || "generic",
    sort_order: Number(formData.get("sortOrder")) || 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/settings/bank-accounts");
  return { success: true };
}

export async function updateBankAccount(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").update({
    bank_name: formData.get("bankName") as string,
    account_holder_name: formData.get("accountHolderName") as string,
    card_number: (formData.get("cardNumber") as string) || null,
    sheba_number: (formData.get("shebaNumber") as string) || null,
    logo_slug: (formData.get("logoSlug") as string) || "generic",
    sort_order: Number(formData.get("sortOrder")) || 0,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/settings/bank-accounts");
  return { success: true };
}

export async function toggleBankAccountActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/settings/bank-accounts");
  return { success: true };
}

export async function deleteBankAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) return { error: "خطا در حذف — احتمالاً سفارشی به این حساب متصل است." };
  revalidatePath("/admin/settings/bank-accounts");
  return { success: true };
}

export async function updateBulkOrderSettings(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").update({
    bulk_order_enabled: formData.get("bulkOrderEnabled") === "on",
    bulk_order_fee_type: formData.get("feeType") as string,
    bulk_order_fee_value: Number(formData.get("feeValue")) || 0,
  }).eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/settings/bank-accounts");
  return { success: true };
}