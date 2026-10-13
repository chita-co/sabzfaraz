import { createAdminClient } from "@/lib/supabase/admin";
import BulkShippingOptionsManager from "@/components/admin/BulkShippingOptionsManager";

export default async function BulkShippingOptionsPage() {
  const { data } = await createAdminClient()
    .from("bulk_shipping_options")
    .select("id, name, price, is_active, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">نحوه‌ی ارسال سفارش‌های جمعی</h1>
      <BulkShippingOptionsManager options={(data ?? []) as { id: string; name: string; price: number; is_active: boolean; sort_order: number }[]} />
    </div>
  );
}