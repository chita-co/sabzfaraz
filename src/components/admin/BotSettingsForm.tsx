"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { updateBotSettings } from "@/app/admin/auction-bots/actions";
import AdminSwitch from "./AdminSwitch";

interface Settings {
  enabled_global: boolean; bot_names: string[]; bots_per_auction: number;
  min_interval_minutes: number; max_interval_minutes: number; stop_after_real_bid: boolean; end_behavior: string;
}

export default function BotSettingsForm({ initial }: { initial: Settings }) {
  const [enabled, setEnabled] = useState(initial.enabled_global);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 560 }}>
      <div className="flex items-center gap-2 mb-6">
        <Bot size={20} className="text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">تنظیمات ربات‌های پیشنهاددهنده</h1>
      </div>

      <div className="admin-form-group">
        <AdminSwitch checked={enabled} onChange={setEnabled} label={enabled ? "ربات‌ها به‌صورت سراسری فعال هستند" : "ربات‌ها غیرفعال هستند"} />
      </div>

      <div className="admin-form-group"><label>تعداد ربات در هر مزایده</label><input type="number" name="botsPerAuction" defaultValue={initial.bots_per_auction} min={1} /></div>

      <div className="grid grid-cols-2 gap-3">
        <div className="admin-form-group"><label>حداقل فاصله بین پیشنهادها (دقیقه)</label><input type="number" name="minInterval" defaultValue={initial.min_interval_minutes} /></div>
        <div className="admin-form-group"><label>حداکثر فاصله بین پیشنهادها (دقیقه)</label><input type="number" name="maxInterval" defaultValue={initial.max_interval_minutes} /></div>
      </div>

      <div className="admin-form-group flex items-center gap-2">
        <input type="checkbox" id="stopAfterRealBid" name="stopAfterRealBid" defaultChecked={initial.stop_after_real_bid} />
        <label htmlFor="stopAfterRealBid" style={{ marginBottom: 0 }}>بعد از اولین پیشنهاد کاربر واقعی، ربات‌ها متوقف شوند</label>
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
    </form>
  );
}