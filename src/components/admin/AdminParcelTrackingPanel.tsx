"use client";

import { useState } from "react";
import { Search, Truck } from "lucide-react";
import { checkParcelTrackingAdmin } from "@/app/admin/orders/tracking-actions";
import PostalTrackingResultView from "@/components/shared/PostalTrackingResultView";

export interface TrackedOrderRow {
  order_number: string;
  postal_tracking_code: string;
  shipping_method_name: string | null;
  status: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PROCESSING: "در حال پردازش",
  PACKING: "آماده‌سازی و بسته‌بندی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
};

type Courier = "auto" | "post" | "tipax";
type TrackResult = Awaited<ReturnType<typeof checkParcelTrackingAdmin>>;

export default function AdminParcelTrackingPanel({
  orders,
}: {
  orders: TrackedOrderRow[];
}) {
  const [code, setCode] = useState("");
  const [courier, setCourier] = useState<Courier>("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);

  async function runTrack(
    trackingCode: string,
    courierHint?: string | null,
    orderNumber?: string
  ) {
    const trimmed = trackingCode.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setActiveOrderNumber(orderNumber ?? null);

    const hint =
      courierHint ?? (courier === "tipax" ? "تیپاکس" : courier === "post" ? "پست" : undefined);

    const res = await checkParcelTrackingAdmin(trimmed, hint);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="admin-card mb-5">
      <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Truck size={18} className="text-green-600" />
        پیگیری مرسولات ارسالی
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        در صورت تأخیر در ارسال یا مشکل کاربر در رهگیری، اینجا می‌توانید با هر
        کد مرسوله‌ای که برای مشتریان ثبت کرده‌اید، وضعیت لحظه‌ای را ببینید.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          dir="ltr"
          placeholder="کد مرسوله را وارد کنید"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runTrack(code)}
          className="flex-1 min-w-50 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={courier}
          onChange={(e) => setCourier(e.target.value as Courier)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="auto">تشخیص خودکار (بر اساس روش ارسال)</option>
          <option value="post">پست ایران</option>
          <option value="tipax">تیپاکس</option>
        </select>
        <button
          type="button"
          onClick={() => runTrack(code)}
          disabled={loading}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700 flex items-center gap-1 disabled:opacity-60"
        >
          <Search size={15} /> {loading ? "..." : "پیگیری"}
        </button>
      </div>

      {orders.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">
            سفارش‌های دارای کد مرسوله ({orders.length})
          </p>
          <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-lg divide-y">
            {orders.map((o) => (
              <button
                key={o.order_number}
                type="button"
                onClick={() => {
                  setCode(o.postal_tracking_code);
                  runTrack(o.postal_tracking_code, o.shipping_method_name, o.order_number);
                }}
                className={`w-full text-right flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                  activeOrderNumber === o.order_number ? "bg-green-50" : ""
                }`}
              >
                <span dir="ltr" className="text-gray-700">
                  {o.order_number}
                </span>
                <span dir="ltr" className="text-gray-500">
                  {o.postal_tracking_code}
                </span>
                <span className="text-gray-400">
                  {statusLabels[o.status] ?? o.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {result && <PostalTrackingResultView result={result} />}
    </div>
  );
}