"use client";

import { Truck, Sparkles, CheckCircle } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/freeShippingConfig";

const MILESTONES = [25, 50, 75];
const fmt = (n: number) => n.toLocaleString("fa-IR");

export default function FreeShippingProgress({ total, enabled }: { total: number; enabled: boolean }) {
  if (!enabled) return null;

  const percent = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);
  const reached = remaining === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-l from-emerald-950/90 via-zinc-900/90 to-zinc-900/90 p-5 mb-8 shadow-[0_0_30px_-8px_rgba(34,197,94,0.5)] backdrop-blur">
      <style>{`
        @keyframes sfShimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
        @keyframes sfFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes sfGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); } 50% { box-shadow: 0 0 0 10px rgba(34,197,94,0); } }
      `}</style>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              reached ? "bg-green-500 text-white" : "bg-amber-400/15 text-amber-300"
            }`}
            style={{ animation: "sfFloat 2.4s ease-in-out infinite" }}
          >
            {reached ? <CheckCircle size={20} /> : <Truck size={20} />}
          </span>
          <div>
            <p className="text-sm font-bold text-white">تا ارسال رایگان</p>
            <p className="text-xs text-zinc-300">
              {reached
                ? "تبریک! ارسال رایگان برای سفارش شما فعال شد"
                : `${fmt(remaining)} تومان تا ارسال رایگان مانده`}
            </p>
          </div>
        </div>

        {reached ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
            <Sparkles size={14} /> فعال
          </span>
        ) : (
          <span className="text-sm font-bold text-amber-300">
            {fmt(Math.round(percent))}٪
          </span>
        )}
      </div>

      {/* نوار پیشرفت */}
      <div className="relative h-4 w-full rounded-full bg-zinc-800 ring-1 ring-white/10">
        <div className="absolute inset-0 flex">
          <div
            className="relative h-full overflow-hidden rounded-full bg-linear-to-l from-amber-300 via-emerald-400 to-green-500 transition-[width] duration-700 ease-out"
            style={{
              width: `${percent}%`,
              animation: reached ? "sfGlow 1.8s ease-in-out infinite" : undefined,
            }}
          >
            <span
              className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/60 to-transparent"
              style={{ animation: "sfShimmer 1.8s linear infinite" }}
            />
          </div>
        </div>

        {MILESTONES.map((m) => (
          <span
            key={m}
            className={`absolute top-1/2 h-2.5 w-2.5 rounded-full ring-2 ring-zinc-900 ${
              percent >= m ? "bg-white" : "bg-zinc-500"
            }`}
            style={{ right: `${m}%`, transform: "translate(50%, -50%)" }}
          />
        ))}
      </div>

      <p className="mt-3 text-[11px] text-zinc-400">
        با رسیدن جمع کالاها به {fmt(FREE_SHIPPING_THRESHOLD)} تومان، ارسال رایگان فعال می‌شود.
      </p>
    </div>
  );
}