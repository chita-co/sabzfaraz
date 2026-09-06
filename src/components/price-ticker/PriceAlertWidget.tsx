"use client";

// هشدار قیمت — عمداً بدون بک‌اند/ایمیل/پیامک پیاده شده:
// هرگونه هشدار سرور-محور (ایمیل/پیامک) نیاز به یک فرآیند زمان‌بندی‌شده‌ی دوره‌ای
// (یعنی دقیقاً همان کرون‌جابی) دارد که طبق درخواست پروژه نباید اضافه شود. به‌جای
// آن، آستانه‌ی قیمت در localStorage مرورگر کاربر ذخیره می‌شود و تا وقتی تب سایت
// باز است، هر بار که قیمت جدید از polling می‌آید بررسی و در صورت رسیدن به هدف،
// یک Notification مرورگری نمایش داده می‌شود. کاملاً رایگان و بدون هیچ سرویس بیرونی.

import { useEffect, useState } from "react";
import { Bell, BellRing, Trash2 } from "lucide-react";
import type { PriceItem } from "@/types/priceTicker";

interface AlertRule {
  symbol: string;
  name: string;
  targetPrice: number;
  direction: "above" | "below";
}

const STORAGE_KEY = "sabzfaraz_price_alerts";

function loadAlerts(): AlertRule[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAlerts(alerts: AlertRule[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export default function PriceAlertWidget({ items }: { items: PriceItem[] }) {
  const [alerts, setAlerts] = useState<AlertRule[]>(() => loadAlerts());
  const [symbol, setSymbol] = useState(items[0]?.symbol ?? "");
  const [target, setTarget] = useState("");
  const [permission, setPermission] = useState<NotificationPermission>(() =>
  typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "default"
);


  // بررسی رسیدن قیمت به هدف، هر بار که items (از polling والد) به‌روز می‌شود
  useEffect(() => {
    if (alerts.length === 0 || items.length === 0) return;
    let changed = false;
    const remaining = alerts.filter((rule) => {
      const item = items.find((i) => i.symbol === rule.symbol);
      if (!item) return true;
      const hit = rule.direction === "above" ? item.price >= rule.targetPrice : item.price <= rule.targetPrice;
      if (hit) {
        changed = true;
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("هشدار قیمت سبزفراز", {
            body: `${rule.name} به ${item.price.toLocaleString("fa-IR")} تومان رسید`,
            icon: "/icon.png",
          });
        }
        return false; // بعد از فعال‌شدن، حذف می‌شود
      }
      return true;
    });
    if (changed) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setAlerts(remaining);
  saveAlerts(remaining);
}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  function addAlert() {
    const item = items.find((i) => i.symbol === symbol);
    const targetPrice = Number(target.replace(/,/g, ""));
    if (!item || !targetPrice) return;
    const direction: AlertRule["direction"] = targetPrice >= item.price ? "above" : "below";
    const next = [...alerts, { symbol: item.symbol, name: item.name, targetPrice, direction }];
    setAlerts(next);
    saveAlerts(next);
    setTarget("");
  }

  function removeAlert(index: number) {
    const next = alerts.filter((_, i) => i !== index);
    setAlerts(next);
    saveAlerts(next);
  }

  return (
    <div className="pt-alert-card">
      <div className="pt-alert-head">
        <Bell size={16} />
        هشدار قیمت (مرورگر شما)
      </div>

      {permission !== "granted" && (
        <button className="pt-alert-perm" onClick={requestPermission}>
          <BellRing size={14} /> فعال‌سازی اعلان مرورگر
        </button>
      )}

      <div className="pt-field-row">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {items.map((i) => (
            <option key={i.symbol} value={i.symbol}>
              {i.name}
            </option>
          ))}
        </select>
        <input
          inputMode="decimal"
          placeholder="قیمت هدف (تومان)"
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ""))}
        />
        <button className="pt-alert-add" onClick={addAlert}>
          ثبت
        </button>
      </div>

      {alerts.length > 0 && (
        <ul className="pt-alert-list">
          {alerts.map((a, i) => (
            <li key={`${a.symbol}-${i}`}>
              <span>
                {a.name} {a.direction === "above" ? "≥" : "≤"} {a.targetPrice.toLocaleString("fa-IR")} تومان
              </span>
              <button onClick={() => removeAlert(i)} aria-label="حذف">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="pt-alert-note">
        این هشدار فقط تا زمانی کار می‌کند که این صفحه در مرورگرتان باز باشد و روی دستگاه شما ذخیره می‌شود.
      </p>

      <style>{`
        .pt-alert-card { background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:18px; padding:16px; color:#e5e7eb; }
        .pt-alert-head { display:flex; align-items:center; gap:8px; font-weight:700; font-size:13.5px; color:#fbbf24; margin-bottom:10px; }
        .pt-alert-perm { display:flex; align-items:center; gap:6px; background:rgba(251,191,36,.12); border:1px solid rgba(251,191,36,.3); color:#fbbf24; border-radius:10px; padding:7px 12px; font-size:12px; margin-bottom:10px; cursor:pointer; }
        .pt-field-row { display:flex; gap:6px; }
        .pt-field-row select { flex: 0 0 40%; }
        .pt-field-row input { flex:1; }
        .pt-field-row input, .pt-field-row select {
  background: rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); color:#fff;
  border-radius:10px; padding:9px 10px; font-size:12.5px; outline:none;
}
.pt-field-row input:focus, .pt-field-row select:focus { border-color:#fbbf24; }
.pt-field-row select option { color:#111827; background:#ffffff; }
        .pt-alert-add { background:#fbbf24; color:#111827; border:none; border-radius:10px; padding:0 14px; font-weight:700; font-size:12.5px; cursor:pointer; }
        .pt-alert-list { list-style:none; margin:12px 0 0; padding:0; display:flex; flex-direction:column; gap:6px; }
        .pt-alert-list li { display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,.04); border-radius:8px; padding:6px 10px; font-size:11.5px; }
        .pt-alert-list button { background:transparent; border:none; color:#ef4444; cursor:pointer; }
        .pt-alert-note { font-size:10.5px; color:#64748b; margin-top:10px; line-height:1.8; }
      `}</style>
    </div>
  );
}
