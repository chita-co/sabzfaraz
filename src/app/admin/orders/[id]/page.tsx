// src/app/admin/orders/[id]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Printer } from "lucide-react";
import OrderStatusControl from "@/components/admin/OrderStatusControl";
import StartTrackingButton from "@/components/admin/StartTrackingButton";

type OrderItem = {
  id: string;
  product_name: string;
  product_image: string | null;
  selected_color: string | null;
  selected_size: string | null;
  quantity: number;
  price: number;
};

export default async function AdminOrderDetailPage({
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
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          سفارش {order.order_number}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/orders/${id}/invoice`}
            target="_blank"
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <Printer size={16} />
            چاپ فاکتور
          </Link>
          <Link
            href={`/admin/orders/${id}/shipping-label`}
            target="_blank"
            className="admin-btn admin-btn-secondary flex items-center gap-2"
          >
            <Printer size={16} />
            چاپ برچسب مرسوله
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 admin-card">
          <h2 className="font-bold text-gray-800 mb-4">اقلام سفارش</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>محصول</th>
                <th>ویژگی</th>
                <th>قیمت واحد</th>
                <th>تعداد</th>
                <th>جمع</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: OrderItem) => (
                <tr key={item.id}>
                  <td className="flex items-center gap-2">
                    {item.product_image && (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        width={40}
                        height={40}
                        className="object-cover rounded-lg"
                        unoptimized
                      />
                    )}
                    <span>{item.product_name}</span>
                  </td>
                  <td className="text-xs text-gray-500">
                    {[item.selected_color, item.selected_size]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </td>
                  <td>{item.price.toLocaleString("fa-IR")}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {(item.price * item.quantity).toLocaleString("fa-IR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-left mt-4 font-bold text-gray-900">
            مبلغ کل: {order.total_amount.toLocaleString("fa-IR")} تومان
          </div>
        </div>

        <div className="space-y-4">
          <div className="admin-card">
            <h2 className="font-bold text-gray-800 mb-3">اطلاعات مشتری</h2>
            <p className="text-sm text-gray-700 mb-1">
              نام: {order.profile?.full_name ?? "—"}
            </p>
            <p className="text-sm text-gray-700">
              تلفن: {order.profile?.phone ?? order.address?.phone ?? "—"}
            </p>
          </div>

          <div className="admin-card">
            <h2 className="font-bold text-gray-800 mb-3">آدرس ارسال</h2>
            <p className="text-sm text-gray-700">
              {order.address?.province} - {order.address?.city}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {order.address?.address_line}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              کد پستی: {order.address?.postal_code}
            </p>
          </div>

          <div className="admin-card">
            <OrderStatusControl
              orderId={order.id}
              currentStatus={order.status}
            />
            <p className="text-sm text-gray-600 mt-2 mb-3">
              وضعیت پرداخت:{" "}
              {order.payment_status === "PAID"
                ? "پرداخت‌شده"
                : "پرداخت‌نشده"}
            </p>
            {order.payment_status === "PAID" && (
              <StartTrackingButton
                orderId={order.id}
                trackingStartedAt={order.tracking_started_at}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}