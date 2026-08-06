"use client";

import { useState } from "react";
import { updateLoyaltySettings } from "@/app/admin/loyalty/actions";

interface Settings {
  toman_per_point: number; point_value_toman: number; min_order_for_redemption: number;
  max_redemption_percent: number; expiry_months: number; reminder_days_before_expiry: number;
}

export default function LoyaltySettingsForm({ initial }: { initial: Settings }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    await updateLoyaltySettings(formData);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 560 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-6">تنظیمات باشگاه مشتریان</h1>

      <div className="admin-form-group">
        <label>هر چند تومان خرید = ۱ امتیاز</label>
        <input type="number" name="tomanPerPoint" defaultValue={initial.toman_per_point} min={1} />
      </div>
      <div className="admin-form-group">
        <label>ارزش هر امتیاز هنگام مصرف (تومان)</label>
        <input type="number" name="pointValueToman" defaultValue={initial.point_value_toman} min={1} />
      </div>
      <div className="admin-form-group">
        <label>حداقل مبلغ سفارش برای استفاده از امتیاز (تومان)</label>
        <input type="number" name="minOrderForRedemption" defaultValue={initial.min_order_for_redemption} min={0} />
      </div>
      <div className="admin-form-group">
        <label>حداکثر درصد سبد خرید قابل پرداخت با امتیاز</label>
        <input type="number" name="maxRedemptionPercent" defaultValue={initial.max_redemption_percent} min={1} max={100} />
      </div>
      <div className="admin-form-group">
        <label>انقضای امتیاز (ماه)</label>
        <input type="number" name="expiryMonths" defaultValue={initial.expiry_months} min={1} />
      </div>
      <div className="admin-form-group">
        <label>یادآوری چند روز قبل از انقضا</label>
        <input type="number" name="reminderDays" defaultValue={initial.reminder_days_before_expiry} min={1} />
      </div>

      {saved && <p className="text-green-600 text-sm mb-3">ذخیره شد.</p>}
      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </form>
  );
}