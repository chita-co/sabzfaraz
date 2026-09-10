"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Truck, Search } from "lucide-react";
import { checkParcelTracking } from "@/app/(shop)/profile/orders/tracking-actions";
import PostalTrackingResultView from "@/components/shared/PostalTrackingResultView";

export interface ParcelTrackingWidgetHandle {
  trackCode: (code: string) => void;
}

type TrackResult = Awaited<ReturnType<typeof checkParcelTracking>>;

const ParcelTrackingWidget = forwardRef<ParcelTrackingWidgetHandle>(
  function ParcelTrackingWidget(_props, ref) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TrackResult | null>(null);

    async function runTrack(value: string) {
      const trimmed = value.trim();
      if (!trimmed) return;
      setLoading(true);
      setResult(null);
      const res = await checkParcelTracking(trimmed);
      setResult(res);
      setLoading(false);
    }

    useImperativeHandle(ref, () => ({
      trackCode: (value: string) => {
        setCode(value);
        runTrack(value);
      },
    }));

    return (
      <div
        id="parcel-tracking"
        className="bg-white rounded-2xl border border-gray-200 p-6 mb-8"
      >
        <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Truck size={18} className="text-green-600" />
          پیگیری مرسوله (کد پستی)
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          بعد از اینکه سفارشتان ارسال شد، کد مرسوله در همین صفحه، کنار سفارش
          مربوطه به شما نمایش داده می‌شود. آن را اینجا وارد کنید تا مسیر دقیق
          مرسوله را ببینید — بدون نیاز به مراجعه به سایت پست.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            dir="ltr"
            placeholder="کد رهگیری مرسوله را وارد کنید"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runTrack(code)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => runTrack(code)}
            disabled={loading}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700 flex items-center gap-1 disabled:opacity-60"
          >
            <Search size={15} /> {loading ? "..." : "پیگیری"}
          </button>
        </div>

        {result && (
          <div className="mt-5">
            <PostalTrackingResultView result={result} />
          </div>
        )}
      </div>
    );
  }
);

export default ParcelTrackingWidget;