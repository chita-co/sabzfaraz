import { notFound } from "next/navigation";
import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import PartnerProductForm from "@/components/partner/PartnerProductForm";
import { getMyAllowedCategoriesAction } from "@/app/partner/products/actions";

export default async function EditPartnerProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();

  // دریافت محصول همکار
  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("partner_id", partner.id)
    .single();

  if (!product) notFound();

  // دریافت دسته‌های فرعی اضافه
  const { data: extraCategories } = await admin
    .from("product_categories")
    .select("category_id")
    .eq("product_id", id);

  // دریافت تخفیف پلکانی
  const { data: quantityTiers } = await admin
    .from("product_quantity_tiers")
    .select("*")
    .eq("product_id", id)
    .order("min_qty", { ascending: true });

  // دریافت ویژگی‌های فنی
  const { data: attributes } = await admin
    .from("product_attributes")
    .select("attr_key, attr_value")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  // دریافت تنظیمات قاب تصویر
  const { data: settings } = await admin
    .from("partner_settings")
    .select("frame_template_url, frame_center_x, frame_center_y, frame_center_width, frame_center_height, frame_output_size")
    .eq("id", 1)
    .single();

  const categories = await getMyAllowedCategoriesAction();

  const extraCategoryIds = (extraCategories ?? [])
    .map((c) => c.category_id)
    .filter((cid) => cid !== product.category_id);

  const productForForm = {
    ...product,
    extraCategoryIds,
    quantityTiers: quantityTiers ?? [],
    attributes: (attributes ?? []).map((a) => ({
      key: a.attr_key,
      value: a.attr_value,
    })),
  };

  const frameConfig = settings
    ? {
        frameUrl: settings.frame_template_url ?? "",
        centerX: settings.frame_center_x,
        centerY: settings.frame_center_y,
        centerWidth: settings.frame_center_width,
        centerHeight: settings.frame_center_height,
        outputSize: settings.frame_output_size,
      }
    : null;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
        ویرایش محصول
      </h1>
      <PartnerProductForm
        mode="edit"
        product={productForForm}
        categories={categories}
        frameConfig={frameConfig}
      />
    </div>
  );
}