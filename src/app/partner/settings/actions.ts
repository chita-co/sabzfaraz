"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActivePartner } from "@/lib/partners/auth";
import { revalidatePath } from "next/cache";

export async function updatePartnerProfileAction(input: {
  businessName: string; contactName: string; address: string; bio: string;
  shebaNumber: string; cardNumber: string; logoUrl: string | null;
}) {
  const partner = await requireActivePartner();
  if (!input.businessName.trim() || !input.address.trim()) return { error: "نام فروشگاه و آدرس نمی‌توانند خالی باشند." };
  if (!input.shebaNumber.trim() && !input.cardNumber.trim()) return { error: "حداقل شماره شبا یا شماره کارت را وارد کنید." };

  const admin = createAdminClient();
  const { error } = await admin.from("partners").update({
    business_name: input.businessName.trim(),
    contact_name: input.contactName.trim() || null,
    address: input.address.trim(),
    bio: input.bio.trim() || null,
    sheba_number: input.shebaNumber.trim() || null,
    card_number: input.cardNumber.trim() || null,
    logo_url: input.logoUrl,
  }).eq("id", partner.id);

  if (error) return { error: error.message };
  revalidatePath("/partner/settings");
  return { success: true };
}

export async function changePartnerPasswordAction(newPassword: string) {
  const partner = await requireActivePartner();
  if (newPassword.length < 6) return { error: "رمز عبور باید حداقل ۶ کاراکتر باشد." };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(partner.id, { password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}