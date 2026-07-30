import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InvoiceDownloadButton from "@/components/shop/InvoiceDownloadButton";
import { getTrackingMessage, getTrackingStageNumber } from "@/lib/tracking";

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
};

// نوع اقلام سفارش
type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  selected_color?: string | null;
  selected_size?: string | null;
};

export default async function MyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, items:order_items(*), address:addresses(*), profile:profiles(full_name)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("site_settings")
      .select("tracking_stage_1, tracking_stage_2, tracking_stage_3, tracking_stage_4, tracking_stage_5, logo_url")
      .eq("id", 1)
      .single(),
  ]);

  if (!order) notFound();

  const trackingMessage = settings
    ? getTrackingMessage(order.tracking_started_at, settings)
    : null;
  const stage = getTrackingStageNumber(order.tracking_started_at);
  const subtotal = order.total_amount - order.shipping_cost;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-1">
        سفارش <span dir="ltr">{order.order_number}</span>
      </h1>
      <p className="text-sm text-gray-500 mb-6">{statusLabels[order.status]}</p>

      {trackingMessage && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6">
          <p className="text-xs text-green-700 mb-1">
            وضعیت پیگیری — مرحله {stage} از ۵
          </p>
          <p className="text-sm text-gray-800">{trackingMessage}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-3">اقلام سفارش</h2>
        {order.items.map((item: OrderItem) => (
          <div
            key={item.id}
            className="flex justify-between text-sm py-2 border-b last:border-0"
          >
            <span>
              {item.product_name} × {item.quantity}
            </span>
            <span>
              {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
            </span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-2 border-b">
          <span>هزینه ارسال</span>
          <span>{order.shipping_cost.toLocaleString("fa-IR")} تومان</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 mt-3 pt-3 border-t">
          <span>مبلغ کل</span>
          <span>{order.total_amount.toLocaleString("fa-IR")} تومان</span>
        </div>
      </div>

      {order.payment_status === "PAID" && (
        <div className="text-center">
          <InvoiceDownloadButton
            orderNumber={order.order_number}
            createdAt={order.created_at}
            customerName={order.profile?.full_name ?? ""}
            address={`${order.address?.province}، ${order.address?.city}، ${order.address?.address_line}`}
            phone={order.address?.phone ?? ""}
            items={order.items.map((i: OrderItem) => ({
              name: i.product_name,
              variant: [i.selected_color, i.selected_size]
                .filter(Boolean)
                .join(" / "),
              price: i.price,
              quantity: i.quantity,
            }))}
            subtotal={subtotal}
            shippingCost={order.shipping_cost}
            total={order.total_amount}
            logoUrl={settings?.logo_url ?? null}
          />
        </div>
      )}
    </div>
  );
}