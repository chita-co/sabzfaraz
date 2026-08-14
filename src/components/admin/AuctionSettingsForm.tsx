"use client";

import { useState } from "react";
import { Settings, Ticket } from "lucide-react";
import { updateAuctionSettings } from "@/app/admin/auction-settings/actions";
import AdminSwitch from "./AdminSwitch";

interface Settings {
  min_topup_amount: number; max_topup_amount: number | null; manual_topup_enabled: boolean; default_final_payment_hours: number;
  winner_discount_enabled: boolean; winner_discount_percent: number; winner_discount_valid_days: number;
}

export default function AuctionSettingsForm({ initial }: { initial: Settings }) {
  const [manualEnabled, setManualEnabled] = useState(initial.manual_topup_enabled);
  const [discountEnabled, setDiscountEnabled] = useState(initial.winner_discount_enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    if (manualEnabled) fd.set("manualTopupEnabled", "on"); else fd.delete("manualTopupEnabled");
    if (discountEnabled) fd.set("winnerDiscountEnabled", "on"); else fd.delete("winnerDiscountEnabled");
    await updateAuctionSettings(fd);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 560 }}>
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} className="text-green-600" />
        <h1 className="text-xl font-bold text-gray-900">تنظیمات عمومی مزایده و کیف پول</h1>
      </div>

      <h2 className="font-bold text-gray-700 text-sm mb-3">کیف پول</h2>
      <div className="admin-form-group"><label>حداقل مبلغ شارژ (تومان)</label><input type="number" name="minTopup" defaultValue={initial.min_topup_amount} /></div>
      <div className="admin-form-group"><label>حداکثر مبلغ شارژ (تومان — اختیاری)</label><input type="number" name="maxTopup" defaultValue={initial.max_topup_amount ?? ""} /></div>
      <div className="admin-form-group"><AdminSwitch checked={manualEnabled} onChange={setManualEnabled} label="امکان شارژ دستی (کارت به کارت / شبا)" /></div>

      <h2 className="font-bold text-gray-700 text-sm mb-3 mt-6">مزایده</h2>
      <div className="admin-form-group"><label>مهلت پیش‌فرض پرداخت نهایی برنده (ساعت)</label><input type="number" name="finalPaymentHours" defaultValue={initial.default_final_payment_hours} /></div>

      <h2 className="font-bold text-gray-700 text-sm mb-3 mt-6 flex items-center gap-1"><Ticket size={15} /> کد تخفیف برندگان</h2>
      <div className="admin-form-group"><AdminSwitch checked={discountEnabled} onChange={setDiscountEnabled} label="صدور خودکار کد تخفیف برای برندگان پس از پرداخت نهایی" /></div>
      {discountEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <div className="admin-form-group"><label>درصد تخفیف</label><input type="number" name="winnerDiscountPercent" defaultValue={initial.winner_discount_percent} min={1} max={100} /></div>
          <div className="admin-form-group"><label>مدت اعتبار (روز)</label><input type="number" name="winnerDiscountValidDays" defaultValue={initial.winner_discount_valid_days} /></div>
        </div>
      )}

      {saved && <p className="text-green-600 text-sm mb-3">ذخیره شد.</p>}
      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">{saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</button>
    </form>
  );
}