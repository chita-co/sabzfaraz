"use client";

import { useState } from "react";
import { Bot, PlayCircle } from "lucide-react";
import { updateBotSettings, runBotsManually } from "@/app/admin/auction-bots/actions";

interface Settings {
  enabled_global: boolean; bot_names: string[]; bots_per_auction: number;
  min_interval_minutes: number; max_interval_minutes: number; stop_after_real_bid: boolean; end_behavior: string;
}

export default function BotSettingsForm({ initial }: { initial: Settings }) {
  const [enabled, setEnabled] = useState(initial.enabled_global);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    if (enabled) fd.set("enabledGlobal", "on"); else fd.delete("enabledGlobal");
    await updateBotSettings(fd);
    setSaving(false);
    setSaved(true);
  }

  async function handleRunNow() {
    setRunning(true);
    setRunResult(null);
    const result = await runBotsManually();
    setRunning(false);

    if (!result) {
      setRunResult("پاسخی از سرور دریافت نشد.");
      return;
    }

    if ("error" in result) {
      setRunResult("خطا: " + result.error);
      return;
    }

    if (result.status === "bots-disabled") {
      setRunResult("ربات‌ها غیرفعال هستند — ابتدا کلید بالا را روشن و ذخیره کنید.");
      return;
    }

    setRunResult(`اجرا شد — ${(result.bidsPlaced ?? 0).toLocaleString("fa-IR")} پیشنهاد جدید توسط ربات‌ها ثبت شد.`);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 560 }}>
      <div className="flex items-center gap-2 mb-6">
        <Bot size={20} className="text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">تنظیمات ربات‌های پیشنهاددهنده</h1>
      </div>

      <label className="ad-toggle-row">
        <span>{enabled ? "ربات‌ها به‌صورت سراسری فعال هستند" : "ربات‌ها غیرفعال هستند"}</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`ad-toggle-switch${enabled ? " on" : ""}`}
        >
          <span className="ad-toggle-knob" />
        </button>
      </label>

      <div className="admin-form-group" style={{ marginTop: 18 }}><label>تعداد ربات در هر مزایده</label><input type="number" name="botsPerAuction" defaultValue={initial.bots_per_auction} min={1} /></div>

      <div className="grid grid-cols-2 gap-3">
        <div className="admin-form-group"><label>حداقل فاصله بین پیشنهادها (دقیقه)</label><input type="number" name="minInterval" defaultValue={initial.min_interval_minutes} /></div>
        <div className="admin-form-group"><label>حداکثر فاصله بین پیشنهادها (دقیقه)</label><input type="number" name="maxInterval" defaultValue={initial.max_interval_minutes} /></div>
      </div>

      <div className="admin-form-group flex items-center gap-2">
        <input type="checkbox" id="stopAfterRealBid" name="stopAfterRealBid" defaultChecked={initial.stop_after_real_bid} />
        <label htmlFor="stopAfterRealBid" style={{ marginBottom: 0 }}>با ثبت اولین پیشنهاد کاربر واقعی، ربات‌ها فوراً متوقف شوند</label>
      </div>

      <div className="admin-form-group">
        <label>رفتار ربات‌ها اگر در پایان مزایده بالاترین پیشنهاد متعلق به ربات باشد</label>
        <select name="endBehavior" defaultValue={initial.end_behavior}>
          <option value="CANCEL">لغو خودکار مزایده و شروع مجدد</option>
          <option value="SECOND_REAL_BIDDER">اعلام نفر دوم واقعی (در صورت وجود)</option>
          <option value="SHOWCASE_WINNER">برنده نمایشی (فقط نمایش، بدون پرداخت واقعی)</option>
        </select>
      </div>

      <div className="admin-form-group">
        <label>لیست نام‌های ربات‌ها (هر نام در یک خط)</label>
        <textarea name="botNames" rows={6} defaultValue={initial.bot_names.join("\n")} />
      </div>

      {saved && <p className="text-green-600 text-sm mb-3">ذخیره شد.</p>}
      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">{saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</button>

      <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 20, paddingTop: 16 }}>
        <p className="text-xs text-gray-500 mb-2">
          روی سرور واقعی (Vercel)، ربات‌ها هر ۱۰ دقیقه خودکار اجرا می‌شوند. برای تست روی localhost، از دکمه‌ی زیر استفاده کنید:
        </p>
        <button type="button" onClick={handleRunNow} disabled={running} className="admin-btn admin-btn-secondary flex items-center gap-2">
          <PlayCircle size={15} /> {running ? "در حال اجرا..." : "اجرای دستی ربات‌ها (تست)"}
        </button>
        {runResult && <p className="text-sm mt-2" style={{ color: runResult.startsWith("خطا") ? "#dc2626" : "#16a34a" }}>{runResult}</p>}
      </div>

      <style jsx>{`
        .ad-toggle-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb; }
        .ad-toggle-row span { font-size:13.5px; color:#374151; font-weight:600; }
        .ad-toggle-switch { position:relative; width:46px; height:26px; border-radius:999px; background:#d1d5db; border:none; cursor:pointer; flex-shrink:0; transition:background .2s; padding:0; }
        .ad-toggle-switch.on { background:#16a34a; }
        .ad-toggle-knob { position:absolute; top:3px; right:3px; width:20px; height:20px; border-radius:50%; background:#fff; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,.3); }
        .ad-toggle-switch.on .ad-toggle-knob { transform: translateX(-20px); }
      `}</style>
    </form>
  );
}