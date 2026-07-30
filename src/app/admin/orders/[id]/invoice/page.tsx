// src/app/admin/orders/[id]/invoice/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AutoPrint from "@/components/admin/AutoPrint";

// نوع اقلام سفارش بر اساس ستون‌های دریافت‌شده
type InvoiceItem = {
  id: string;
  product_name: string;
  selected_color: string | null;
  selected_size: string | null;
  quantity: number;
  price: number;
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, profile:profiles(full_name, phone), address:addresses(*), items:order_items(*)"
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <AutoPrint />
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h1 className="text-lg font-bold text-green-700">سبزفراز</h1>
          <p className="text-xs text-gray-500">فاکتور فروش</p>
        </div>
        <div className="text-left text-xs text-gray-600">
          <p>شماره سفارش: {order.order_number}</p>
          <p>تاریخ: {new Date(order.created_at).toLocaleDateString("fa-IR")}</p>
        </div>
      </div>

      <div className="mb-4 text-sm">
        <p>
          <strong>خریدار:</strong> {order.profile?.full_name}
        </p>
        <p>
          <strong>آدرس:</strong> {order.address?.province} - {order.address?.city}{" "}
          - {order.address?.address_line}
        </p>
        <p>
          <strong>کد پستی:</strong> {order.address?.postal_code} —{" "}
          <strong>تلفن:</strong> {order.address?.phone}
        </p>
      </div>

      <table className="admin-table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th>ردیف</th>
            <th>شرح کالا</th>
            <th>ویژگی</th>
            <th>تعداد</th>
            <th>قیمت واحد (تومان)</th>
            <th>جمع (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: InvoiceItem, i: number) => (
            <tr key={item.id}>
              <td>{i + 1}</td>
              <td>{item.product_name}</td>
              <td>
                {[item.selected_color, item.selected_size]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </td>
              <td>{item.quantity}</td>
              <td>{item.price.toLocaleString("fa-IR")}</td>
              <td>{(item.price * item.quantity).toLocaleString("fa-IR")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-left font-bold text-gray-900 mb-8">
        مبلغ نهایی قابل پرداخت: {order.total_amount.toLocaleString("fa-IR")} تومان
      </div>

      <p className="text-center text-xs text-gray-400">
        این فاکتور به‌صورت الکترونیکی از فروشگاه سبزفراز صادر شده است.
      </p>
    </div>
  );
}