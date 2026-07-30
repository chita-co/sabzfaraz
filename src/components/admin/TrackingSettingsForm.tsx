"use client";

import { useState } from "react";
import { updateTrackingSettings } from "@/app/admin/tracking-settings/actions";

const PRESETS: Record<number, string[]> = {
  1: [
    "سفارش شما در حال پردازش است.",
    "سفارش شما ثبت و در نوبت پردازش قرار گرفت.",
  ],
  2: [
    "سفارش شما در حال آماده‌سازی است.",
    "کالای شما در حال بسته‌بندی است.",
  ],
  3: [
    "سفارش شما در مراحل ارسال قرار دارد.",
    "سفارش شما تحویل واحد ارسال شد.",
  ],
  4: [
    "بسته شما از طریق پست (تیپاکس) ارسال شد و طی ۲ تا ۵ روز آینده به دستتان می‌رسد.",
    "مرسوله شما تحویل پست تیپاکس داده شد.",
  ],
  5: [
    "برای پیگیری دقیق‌تر مرسوله، با کد ۱۳ رقمی پستی که برایتان ارسال شده به سایت رهگیری مرسولات پستی مراجعه کنید.",
    "سفارش شما با موفقیت تحویل داده شد. با تشکر از خرید شما.",
  ],
};

function StageField({
  index,
  defaultValue,
}: {
  index: number;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="admin-form-group">
      <label>
        پیام مرحله {index} (۲۴ ساعت{" "}
        {index === 1
          ? "اول"
          : index === 2
          ? "دوم"
          : index === 3
          ? "سوم"
          : index === 4
          ? "چهارم"
          : "پنجم"}
        )
      </label>
      <div className="flex gap-2 mb-2">
        <select
          className="admin-input flex-1"
          onChange={(e) => {
            if (e.target.value === "custom") return;
            setValue(e.target.value);
          }}
        >
          <option value="custom">متن سفارشی (زیر بنویس)</option>
          {PRESETS[index].map((p, i) => (
            <option key={i} value={p}>
              {p.slice(0, 40)}...
            </option>
          ))}
        </select>
      </div>
      <textarea
        name={`stage${index}`}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export default function TrackingSettingsForm({
  initial,
}: {
  initial: {
    tracking_stage_1: string;
    tracking_stage_2: string;
    tracking_stage_3: string;
    tracking_stage_4: string;
    tracking_stage_5: string;
  };
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    await updateTrackingSettings(formData);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        پیام‌های پیگیری سفارش
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        این ۵ پیام یک‌بار تنظیم می‌شوند و برای همه‌ی سفارش‌ها به‌صورت خودکار
        (هر ۲۴ ساعت یک مرحله) نمایش داده می‌شوند.
      </p>

      <StageField index={1} defaultValue={initial.tracking_stage_1} />
      <StageField index={2} defaultValue={initial.tracking_stage_2} />
      <StageField index={3} defaultValue={initial.tracking_stage_3} />
      <StageField index={4} defaultValue={initial.tracking_stage_4} />
      <StageField index={5} defaultValue={initial.tracking_stage_5} />

      {saved && <p className="text-green-600 text-sm mb-3">ذخیره شد.</p>}

      <button
        type="submit"
        disabled={saving}
        className="admin-btn admin-btn-primary"
      >
        {saving ? "در حال ذخیره..." : "ذخیره پیام‌ها"}
      </button>
    </form>
  );
}