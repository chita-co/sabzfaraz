"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Search, Package, Truck } from "lucide-react";
import { getTrackingMessage, getTrackingStageNumber } from "@/lib/tracking";
import ParcelTrackingWidget, {
  type ParcelTrackingWidgetHandle,
} from "@/components/shop/ParcelTrackingWidget";

interface OrderRow {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  tracking_started_at: string | null;
  postal_tracking_code: string | null;
  created_at: string;
}

// نوع دقیق برای تنظیمات پیگیری
interface TrackingSettings {
  tracking_stage_1: string;
  tracking_stage_2: string;
  tracking_stage_3: string;
  tracking_stage_4: string;
  tracking_stage_5: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PROCESSING: "در حال پردازش",
  PACKING: "آماده‌سازی و بسته‌بندی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
};

// سفارش‌هایی با این وضعیت‌ها هنوز «باز» محسوب می‌شوند و هنوز به مشتری تحویل نشده‌اند
const OPEN_STATUSES = new Set(["PENDING", "PROCESSING", "PACKING", "SHIPPED"]);

export default function OrdersListClient({
  orders,
  trackingSettings,
}: {
  orders: OrderRow[];
  trackingSettings: TrackingSettings;
}) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    found: boolean;
    message: string | null;
    stage: number;
  } | null>(null);
  const parcelTrackingRef = useRef<ParcelTrackingWidgetHandle>(null);

  function handleTrackParcel(trackingCode: string) {
    parcelTrackingRef.current?.trackCode(trackingCode);
    document
      .getElementById("parcel-tracking")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSearch() {
    const order = orders.find((o) => o.order_number.trim() === code.trim());
    if (!order) {
      setResult({ found: false, message: null, stage: 0 });
      return;
    }
    if (!order.tracking_started_at) {
      setResult({
        found: true,
        message: "پیگیری این سفارش هنوز توسط فروشگاه آغاز نشده است.",
        stage: 0,
      });
      return;
    }
    const message = trackingSettings
      ? getTrackingMessage(order.tracking_started_at, trackingSettings)
      : null;
    setResult({
      found: true,
      message,
      stage: getTrackingStageNumber(order.tracking_started_at),
    });
  }

  const openOrders = orders.filter((o) => OPEN_STATUSES.has(o.status));
  const closedOrders = orders.filter((o) => !OPEN_STATUSES.has(o.status));

  function renderOrderCard(o: OrderRow) {
    const stageMessage =
      o.tracking_started_at && trackingSettings
        ? getTrackingMessage(o.tracking_started_at, trackingSettings)
        : null;
    const stageNumber = o.tracking_started_at
      ? getTrackingStageNumber(o.tracking_started_at)
      : 0;

    return (
      <Link
        key={o.id}
        href={`/profile/orders/${o.id}`}
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-green-400"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Package size={18} />
          </div>
          <div>
            <p dir="ltr" className="text-sm font-medium text-gray-800 text-right">
              {o.order_number}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(o.created_at).toLocaleDateString("fa-IR")}
            </p>
            {stageMessage && (
              <p className="text-xs text-green-700 mt-1">
                مرحله {stageNumber} از ۵ — {stageMessage}
              </p>
            )}
          </div>
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-gray-900">
            {o.total_amount.toLocaleString("fa-IR")} تومان
          </p>
          <p className="text-xs text-gray-500">{statusLabels[o.status]}</p>
          {o.postal_tracking_code && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTrackParcel(o.postal_tracking_code as string);
              }}
              className="mt-1 inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
            >
              <Truck size={12} /> پیگیری مرسوله
            </button>
          )}
        </div>
      </Link>
    );
  }

  return (
   <div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="font-bold text-white mb-1">پیگیری سفارش</h2>
        <p className="text-xs text-gray-500 mb-3">
          کد سفارش خود را وارد کنید تا از مراحل پردازش، آماده‌سازی و ارسال
          سفارشتان مطلع شوید.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            dir="ltr"
            placeholder="کد رهگیری / شماره سفارش را وارد کنید"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700 flex items-center gap-1"
          >
            <Search size={15} /> پیگیری
          </button>
        </div>

        {result && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
            {!result.found ? (
              <p className="text-red-600">سفارشی با این کد یافت نشد.</p>
            ) : result.message ? (
              <>
                <p className="text-gray-500 text-xs mb-1">
                  مرحله {result.stage} از ۵
                </p>
                <p className="text-gray-800">{result.message}</p>
              </>
            ) : (
              <p className="text-gray-600">
                {result.message ?? "پیگیری این سفارش هنوز آغاز نشده است."}
              </p>
            )}
          </div>
        )}
      </div>

      <ParcelTrackingWidget ref={parcelTrackingRef} />

      <h2 className="font-bold text-white mb-4">سفارشات باز</h2>
      <div className="space-y-3 mb-8">
        {openOrders.map(renderOrderCard)}
        {openOrders.length === 0 && (
          <p className="text-gray-500 text-sm">سفارش بازی ندارید.</p>
        )}
      </div>

      <h2 className="font-bold text-white mb-4">تاریخچه سفارشات</h2>
      <div className="space-y-3">
        {closedOrders.map(renderOrderCard)}
        {closedOrders.length === 0 && (
          <p className="text-gray-500 text-sm">هنوز سفارشی ثبت نکرده‌اید.</p>
        )}
      </div>
    </div>
  );
}