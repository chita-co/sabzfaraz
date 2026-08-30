"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("دسترسی غیرمجاز");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("دسترسی غیرمجاز");
}

export async function approvePartnerProductAction(productId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("partner_id, name").eq("id", productId).single();
  if (!product) return { error: "محصول یافت نشد" };

  await admin.from("products").update({ partner_approval_status: "APPROVED", is_active: true, partner_rejection_reason: null }).eq("id", productId);

  if (product.partner_id) {
    await createNotification(product.partner_id, "محصول شما تأیید شد ✅", `محصول «${product.name}» بررسی و در سایت منتشر شد.`);
  }
  revalidatePath("/admin/partners/products");
  return { success: true };
}

export async function rejectPartnerProductAction(productId: string, reason: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("partner_id, name").eq("id", productId).single();
  if (!product) return { error: "محصول یافت نشد" };

  await admin.from("products").update({ partner_approval_status: "REJECTED", is_active: false, partner_rejection_reason: reason }).eq("id", productId);

  if (product.partner_id) {
    await createNotification(product.partner_id, "محصول شما رد شد ❌", `محصول «${product.name}» تأیید نشد. دلیل: ${reason}`);
  }
  revalidatePath("/admin/partners/products");
  return { success: true };
}

export async function adminUpdatePartnerProductAction(productId: string, payload: {
  name: string; description: string; categoryId: string; price: number; partnerCostPrice: number; stock: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("products").update({
    name: payload.name, description: payload.description, category_id: payload.categoryId,
    price: payload.price, partner_cost_price: payload.partnerCostPrice, stock: payload.stock,
  }).eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/partners/products");
  return { success: true };
}