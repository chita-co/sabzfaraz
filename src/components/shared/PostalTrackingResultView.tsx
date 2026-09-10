"use client";

import { MapPin, ExternalLink, PackageCheck } from "lucide-react";

type TrackResult =
  | { status: "unauthorized" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "provider_not_configured"; fallbackUrl: string }
  | {
      status: "found";
      currentStatus: string;
      events: { date: string; time: string; location: string; description: string }[];
      deliveredTo?: string | null;
    };

/**
 * نمایش مشترکِ نتیجه‌ی پیگیری مرسوله — هم در پنل کاربر (ParcelTrackingWidget)
 * و هم در پنل ادمین (AdminParcelTrackingPanel) از همین کامپوننت استفاده می‌شود
 * تا ظاهر و منطق نمایش یکسان بماند.
 */
export default function PostalTrackingResultView({ result }: { result: TrackResult }) {
  if (result.status === "unauthorized") {
    return (
      <p className="text-sm text-red-600">این کد به سفارش معتبری تعلق ندارد.</p>
    );
  }

  if (result.status === "not_found") {
    return <p className="text-sm text-red-600">مرسوله‌ای با این کد یافت نشد.</p>;
  }

  if (result.status === "error") {
    return <p className="text-sm text-red-600">{result.message}</p>;
  }

  if (result.status === "provider_not_configured") {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm">
        <p className="text-amber-800 mb-2">
          نمایش لحظه‌ای وضعیت مرسوله هنوز روی سایت فعال نشده است.
        </p>
        <a
          href={result.fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-green-700 font-medium"
        >
          پیگیری در سایت شرکت پستی <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 rounded-lg bg-green-50 border border-green-200 p-3">
        <span className="text-sm font-bold text-green-800 flex items-center gap-1">
          <PackageCheck size={16} /> {result.currentStatus}
        </span>
        {result.deliveredTo && (
          <span className="text-xs text-green-700">تحویل به: {result.deliveredTo}</span>
        )}
      </div>
      <div className="pr-1">
        {result.events.map((ev, i) => (
          <div
            key={i}
            className="relative pb-6 pr-6 border-r-2 border-gray-200 last:border-transparent last:pb-0"
          >
            <span className="absolute -right-1.75 top-0 w-3 h-3 rounded-full bg-green-600 ring-4 ring-green-100" />
            <p className="text-sm font-medium text-gray-900">{ev.description}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {ev.location}
              <span className="mx-1">•</span>
              {ev.date} - {ev.time}
            </p>
          </div>
        ))}
        {result.events.length === 0 && (
          <p className="text-sm text-gray-500">
            هنوز رویدادی برای این مرسوله ثبت نشده است.
          </p>
        )}
      </div>
    </div>
  );
}