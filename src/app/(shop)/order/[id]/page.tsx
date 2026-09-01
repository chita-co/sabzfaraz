import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import ClearCartOnSuccess from "@/components/shop/ClearCartOnSuccess";
import InvoiceDownloadButton from "@/components/shop/InvoiceDownloadButton";
import IridescenceBackground from "@/components/backgrounds/IridescenceBackground";
import { createAdminClient } from "@/lib/supabase/admin";

// نوع اقلام سفارش
type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  selected_color?: string | null;
  selected_size?: string | null;
};

export default async function OrderResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; status?: string }>;
}) {
  const { id } = await params;
  const { payment, status } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // اگر کاربر مهمان باشد و query پارامتر payment نداشته باشد، به لاگین بفرست
  if (!user && !payment) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settings: any = null;

  if (user) {
    const [{ data: userOrder }, { data: siteSettings }] = await Promise.all([
      supabase
        .from("orders")
        .select("*, items:order_items(*), address:addresses(*), profile:profiles(full_name)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase.from("site_settings").select("logo_url, store_name, support_phone, support_phone_2, store_address, support_email").eq("id", 1).single(),
    ]);
    order = userOrder;
    settings = siteSettings;
  } else if (payment) {
    const admin = createAdminClient();
    const [{ data: guestOrder }, { data: siteSettings }] = await Promise.all([
      admin
        .from("orders")
        .select("*, items:order_items(*), address:addresses(*), profile:profiles(full_name)")
        .eq("id", id)
        .single(),
      admin.from("site_settings").select("logo_url, store_name, support_phone, support_phone_2, store_address, support_email").eq("id", 1).single(),
    ]);
    order = guestOrder;
    settings = siteSettings;
  }

  if (!order) notFound();

  const isChinaOrder = order.order_type === "CHINA_ORDER";

  const isSuccess = order.payment_status === "PAID";
  const isOfflineRegistered = payment === "offline" && status === "registered";

  const subtotal = order.total_amount - order.shipping_cost;

  return (
    <>
      <IridescenceBackground />
      <div className="mx-auto max-w-2xl px-4 py-16 text-center relative z-10 bg-white rounded-2xl shadow-lg">
        {isSuccess && <ClearCartOnSuccess />}
        {isSuccess ? (
          <CheckCircle2 size={56} className="mx-auto text-green-600 mb-4" />
        ) : isOfflineRegistered ? (
          <CheckCircle2 size={56} className="mx-auto text-green-600 mb-4" />
        ) : payment === "failed" ? (
          <XCircle size={56} className="mx-auto text-red-500 mb-4" />
        ) : (
          <Clock size={56} className="mx-auto text-yellow-500 mb-4" />
        )}

        <h1 className="text-lg font-bold text-gray-900 mb-2">
          {isSuccess
            ? "پرداخت با موفقیت انجام شد"
            : isOfflineRegistered
            ? "پرداخت شما ثبت شد"
            : "پرداخت ناموفق بود"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          شماره سفارش / کد رهگیری:{" "}
          <span dir="ltr" className="font-bold text-gray-800">
            {order.order_number}
          </span>
        </p>

        {isOfflineRegistered && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 mb-6">
            پرداخت شما با موفقیت ثبت شد. کارشناسان ما پس از بررسی پرداخت، سفارش را
            تایید خواهند کرد.
          </div>
        )}

        {isSuccess && (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-right mb-6">
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

            <div className="mb-6">
              <InvoiceDownloadButton
                orderNumber={order.order_number}
                createdAt={order.created_at}
                customerName={order.profile?.full_name ?? ""}
                address={`${order.address?.province}، ${order.address?.city}، ${order.address?.address_line}`}
                phone={order.address?.phone ?? ""}
                postalCode={order.address?.postal_code ?? ""}
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
                storeName={settings?.store_name ?? "سبزفراز"}
                storePhones={Array.from(
                  new Set(
                    [settings?.support_phone, settings?.support_phone_2]
                      .filter(Boolean)
                      .flatMap((x) => String(x).split(/[-–—]/).map((s) => s.trim()))
                      .filter(Boolean)
                  )
                ) as string[]}
                storeAddress={settings?.store_address ?? ""}
                storeEmail={settings?.support_email ?? null}
                invoiceType={isChinaOrder ? "china" : "final"}
                chinaDeliveryText={order.china_delivery_text ?? "طبق توافق هنگام ثبت سفارش"}
                chinaTermsText={order.china_terms_text ?? "خریدار با آگاهی از زمان تحویل غیرفوری اقدام به ثبت سفارش نموده است."}
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-block rounded-full bg-green-600 px-8 py-3 text-sm font-bold text-white hover:bg-green-700"
          >
            بازگشت به فروشگاه
          </Link>
          <Link
            href="/profile/wallet"
            prefetch={false}
            className="inline-block rounded-full bg-gray-100 px-8 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200"
          >
            مشاهده موجودی کیف پول
          </Link>
        </div>
      </div>
    </>
  );
}