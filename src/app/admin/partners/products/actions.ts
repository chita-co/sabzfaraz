"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { revalidatePath, updateTag } from "next/cache";
import { submitUrlToIndexNow, submitUrlsToIndexNow } from "@/lib/indexNow";

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
  const { data: product } = await admin.from("products").select("partner_id, name, slug").eq("id", productId).single();
  if (!product) return { error: "محصول یافت نشد" };

  await admin.from("products").update({ partner_approval_status: "APPROVED", is_active: true, partner_rejection_reason: null }).eq("id", productId);

  if (product.partner_id) {
    await createNotification(product.partner_id, "محصول شما تأیید شد ✅", `محصول «${product.name}» بررسی و در سایت منتشر شد.`);
  }
  revalidatePath("/admin/partners/products");
  updateTag("products");
  revalidatePath(`/products/${product.slug}`);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir";
await submitUrlToIndexNow(`${baseUrl}/products/${product.slug}`);
  return { success: true };
}

export async function rejectPartnerProductAction(productId: string, reason: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("partner_id, name, slug").eq("id", productId).single();
  if (!product) return { error: "محصول یافت نشد" };

  await admin.from("products").update({ partner_approval_status: "REJECTED", is_active: false, partner_rejection_reason: reason }).eq("id", productId);

  if (product.partner_id) {
    await createNotification(product.partner_id, "محصول شما رد شد ❌", `محصول «${product.name}» تأیید نشد. دلیل: ${reason}`);
  }
  revalidatePath("/admin/partners/products");
  updateTag("products");
  // رد شدن = محصول غیرفعال می‌شه (is_active: false)، صفحه‌ش هم باید فوراً از کش پاک بشه.
  if (product.slug) revalidatePath(`/products/${product.slug}`);
  return { success: true };
}

export async function bulkApprovePartnerProductsAction(productIds: string[]) {
  await requireAdmin();
  const ids = Array.from(new Set(productIds));
  if (!ids.length) return { error: "هیچ محصولی انتخاب نشده" };
  const admin = createAdminClient();

  type Row = { id: string; partner_id: string | null; name: string; slug: string | null };
  const CHUNK = 50; // جلوگیری از طولانی‌شدن بیش‌ازحد URL درخواست به Supabase
  const approved: Row[] = [];
  let firstError: string | null = null;

  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);

    const { data: rows, error: selectError } = await admin
      .from("products")
      .select("id, partner_id, name, slug")
      .in("id", chunk);
    if (selectError) { firstError = firstError ?? selectError.message; continue; }

    const { error: updateError } = await admin
      .from("products")
      .update({ partner_approval_status: "APPROVED", is_active: true, partner_rejection_reason: null })
      .in("id", chunk);
    if (updateError) { firstError = firstError ?? updateError.message; continue; }

    approved.push(...((rows ?? []) as Row[]));
  }

  // اعلان برای همکارها (یک insert برای همه)
  const notifRows = approved
    .filter((p) => p.partner_id)
    .map((p) => ({
      user_id: p.partner_id,
      title: "محصول شما تأیید شد ✅",
      message: `محصول «${p.name}» بررسی و در سایت منتشر شد.`,
    }));
  if (notifRows.length > 0) {
    const { error: notifError } = await admin.from("notifications").insert(notifRows);
    if (notifError) console.error("خطا در ثبت اعلان تأیید گروهی:", notifError.message);
  }

  // پاک‌کردن کش صفحه‌ی هر محصول + صف بررسی
  for (const p of approved) {
    if (p.slug) revalidatePath(`/products/${p.slug}`);
  }
  revalidatePath("/admin/partners/products");
  updateTag("products");

  // اطلاع به موتورهای جستجو (یک درخواست برای همه)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir";
  await submitUrlsToIndexNow(
    approved.filter((p) => p.slug).map((p) => `${baseUrl}/products/${p.slug}`)
  );

  if (firstError && approved.length === 0) {
    return { error: "خطا در تأیید محصولات: " + firstError, count: 0 };
  }
  if (firstError) {
    return { error: `فقط ${approved.length} محصول تأیید شد، بقیه با خطا مواجه شدند: ` + firstError, count: approved.length };
  }
  return { success: true, count: approved.length };
}

export async function bulkRejectPartnerProductsAction(productIds: string[], reason: string) {
  await requireAdmin();
  const ids = Array.from(new Set(productIds));
  if (!ids.length) return { error: "هیچ محصولی انتخاب نشده" };
  const finalReason = (reason || "").trim() || "تأیید نشد";
  const admin = createAdminClient();

  type Row = { id: string; partner_id: string | null; name: string; slug: string | null };
  const CHUNK = 50; // جلوگیری از طولانی‌شدن بیش‌ازحد URL درخواست به Supabase
  const rejected: Row[] = [];
  let firstError: string | null = null;

  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);

    const { data: rows, error: selectError } = await admin
      .from("products")
      .select("id, partner_id, name, slug")
      .in("id", chunk);
    if (selectError) { firstError = firstError ?? selectError.message; continue; }

    const { error: updateError } = await admin
      .from("products")
      .update({ partner_approval_status: "REJECTED", is_active: false, partner_rejection_reason: finalReason })
      .in("id", chunk);
    if (updateError) { firstError = firstError ?? updateError.message; continue; }

    rejected.push(...((rows ?? []) as Row[]));
  }

  // اعلان برای همکارها (یک insert برای همه)
  const notifRows = rejected
    .filter((p) => p.partner_id)
    .map((p) => ({
      user_id: p.partner_id,
      title: "محصول شما رد شد ❌",
      message: `محصول «${p.name}» تأیید نشد. دلیل: ${finalReason}`,
    }));
  if (notifRows.length > 0) {
    const { error: notifError } = await admin.from("notifications").insert(notifRows);
    if (notifError) console.error("خطا در ثبت اعلان رد گروهی:", notifError.message);
  }

  // رد شدن = غیرفعال شدن، پس کش صفحه‌ی هر محصول پاک می‌شود
  for (const p of rejected) {
    if (p.slug) revalidatePath(`/products/${p.slug}`);
  }
  revalidatePath("/admin/partners/products");
  updateTag("products");

  if (firstError && rejected.length === 0) {
    return { error: "خطا در رد محصولات: " + firstError, count: 0 };
  }
  if (firstError) {
    return { error: `فقط ${rejected.length} محصول رد شد، بقیه با خطا مواجه شدند: ` + firstError, count: rejected.length };
  }
  return { success: true, count: rejected.length };
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
  const { data: updatedProduct } = await admin
  .from("products")
  .select("slug, partner_approval_status, is_active")
  .eq("id", productId)
  .single();
  revalidatePath("/admin/partners/products");
  updateTag("products");
  if (updatedProduct?.slug) revalidatePath(`/products/${updatedProduct.slug}`);
  if (updatedProduct && updatedProduct.partner_approval_status === "APPROVED" && updatedProduct.is_active) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir";
  await submitUrlToIndexNow(`${baseUrl}/products/${updatedProduct.slug}`);
}
  return { success: true };
}