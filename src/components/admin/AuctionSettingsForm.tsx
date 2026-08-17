"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Ticket } from "lucide-react";
import { updateAuctionSettings } from "@/app/admin/auction-settings/actions";

interface Settings {
  min_topup_amount: number; max_topup_amount: number | null; manual_topup_enabled: boolean; default_final_payment_hours: number;
  winner_discount_enabled: boolean; winner_discount_percent: number; winner_discount_valid_days: number;
}

export default function AuctionSettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [manualEnabled, setManualEnabled] = useState(initial.manual_topup_enabled);
  const [discountEnabled, setDiscountEnabled] = useState(initial.winner_discount_enabled);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    const fd = new FormData(e.currentTarget);
    if (manualEnabled) fd.set("manualTopupEnabled", "on"); else fd.delete("manualTopupEnabled");
    if (discountEnabled) fd.set("winnerDiscountEnabled", "on"); else fd.delete("winnerDiscountEnabled");
    const result = await updateAuctionSettings(fd);
    setSaving(false);
    if (result?.error) { setSaveError(result.error); return; }
    setSaved(true);
    router.refresh();
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

      <label className="ad-toggle-row" style={{ marginBottom: 18 }}>
        <span>{manualEnabled ? "شارژ دستی (کارت به کارت / شبا) فعال است" : "شارژ دستی غیرفعال است"}</span>
        <button type="button" role="switch" aria-checked={manualEnabled} onClick={() => setManualEnabled((v) => !v)} className={`ad-toggle-switch${manualEnabled ? " on" : ""}`}>
          <span className="ad-toggle-knob" />
        </button>
      </label>

      <h2 className="font-bold text-gray-700 text-sm mb-3 mt-2">مزایده</h2>
      <div className="admin-form-group"><label>مهلت پیش‌فرض پرداخت نهایی برنده (ساعت)</label><input type="number" name="finalPaymentHours" defaultValue={initial.default_final_payment_hours} /></div>

      <h2 className="font-bold text-gray-700 text-sm mb-3 mt-2 flex items-center gap-1"><Ticket size={15} /> کد تخفیف برندگان</h2>
      <label className="ad-toggle-row" style={{ marginBottom: 18 }}>
        <span>{discountEnabled ? "صدور خودکار کد تخفیف برای برندگان فعال است" : "صدور خودکار کد تخفیف غیرفعال است"}</span>
        <button type="button" role="switch" aria-checked={discountEnabled} onClick={() => setDiscountEnabled((v) => !v)} className={`ad-toggle-switch${discountEnabled ? " on" : ""}`}>
          <span className="ad-toggle-knob" />
        </button>
      </label>

      {discountEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <div className="admin-form-group"><label>درصد تخفیف</label><input type="number" name="winnerDiscountPercent" defaultValue={initial.winner_discount_percent} min={1} max={100} /></div>
          <div className="admin-form-group"><label>مدت اعتبار (روز)</label><input type="number" name="winnerDiscountValidDays" defaultValue={initial.winner_discount_valid_days} /></div>
        </div>
      )}

      {saveError && <p className="text-red-600 text-sm mb-3">{saveError}</p>}
      {saved && !saveError && <p className="text-green-600 text-sm mb-3">ذخیره شد.</p>}
      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">{saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</button>

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