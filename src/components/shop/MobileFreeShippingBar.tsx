"use client";

import { Truck, CheckCircle2 } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/freeShippingConfig";

const fmt = (n: number) => n.toLocaleString("fa-IR");
const MILESTONES = [25, 50, 75];

export default function MobileFreeShippingBar({ total }: { total: number }) {
  const percent = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);
  const reached = remaining === 0;

  return (
    <div
      style={{
        margin: "12px 14px 4px",
        padding: 14,
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
        color: "#fff",
        background: reached
          ? "linear-gradient(135deg,#052e16,#14532d)"
          : "linear-gradient(135deg,#0f172a,#1e293b)",
        boxShadow: reached
          ? "0 10px 26px -10px rgba(34,197,94,.7)"
          : "0 10px 26px -12px rgba(0,0,0,.5)",
      }}
    >
      <style>{`
        @keyframes sfmShine { from { transform: translateX(-120%); } to { transform: translateX(320%); } }
        @keyframes sfmPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: reached ? "#22c55e" : "rgba(251,191,36,.18)",
            color: reached ? "#fff" : "#fbbf24",
            animation: reached ? undefined : "sfmPulse 2s ease-in-out infinite",
          }}
        >
          {reached ? <CheckCircle2 size={20} /> : <Truck size={20} />}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>
            {reached ? "ارسال رایگان فعال شد 🎉" : "تا ارسال رایگان"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#cbd5e1" }}>
            {reached
              ? "هزینه‌ی ارسال سفارش شما صفر است"
              : `${fmt(remaining)} تومان تا ارسال رایگان مانده`}
          </p>
        </div>

        <span style={{ fontSize: 12, fontWeight: 900, color: reached ? "#86efac" : "#fbbf24" }}>
          {fmt(Math.round(percent))}٪
        </span>
      </div>

      <div
        style={{
          position: "relative",
          height: 10,
          borderRadius: 999,
          background: "rgba(255,255,255,.08)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: `${percent}%`,
            borderRadius: 999,
            overflow: "hidden",
            background: "linear-gradient(to left,#fbbf24,#34d399,#22c55e)",
            transition: "width .6s ease",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "40%",
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent)",
              animation: "sfmShine 1.8s linear infinite",
            }}
          />
        </div>

        {MILESTONES.map((m) => (
          <span
            key={m}
            style={{
              position: "absolute",
              top: "50%",
              right: `${m}%`,
              width: 8,
              height: 8,
              borderRadius: "50%",
              transform: "translate(50%,-50%)",
              background: percent >= m ? "#fff" : "#475569",
              boxShadow: "0 0 0 2px #0f172a",
            }}
          />
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
        با رسیدن جمع کالاها به {fmt(FREE_SHIPPING_THRESHOLD)} تومان، ارسال رایگان فعال می‌شود.
      </p>
    </div>
  );
}