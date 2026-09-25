"use client";

import { useState } from "react";
import { toggleTorobOrderTracking } from "@/app/admin/torob-settings/actions";
import AdminSwitch from "./AdminSwitch";

export default function TorobSettingsForm({ enabled: initialEnabled }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle(value: boolean) {
    setEnabled(value);
    setSaving(true);
    await toggleTorobOrderTracking(value);
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">اتصال پیگیری سفارش ترب</h1>
        <AdminSwitch
          checked={enabled}
          onChange={handleToggle}
          label={saving ? "در حال ذخیره..." : enabled ? "فعال است" : "غیرفعال است"}
        />
      </div>

      <div className="admin-card">
        <p className="text-sm text-gray-600 leading-7 mb-3">
          وقتی این گزینه فعال باشد، ترب می‌تواند از طریق آدرس زیر اطلاعات سفارش‌هایی را که
          از طریق کلیک روی سایت ترب انجام شده‌اند دریافت کند. اگر غیرفعال باشد، این آدرس
          برای ترب کد خطای ۴۰۳ برمی‌گرداند و هیچ اطلاعات سفارشی رد و بدل نمی‌شود.
        </p>
        <code className="block bg-gray-100 rounded p-3 text-sm text-left" dir="ltr">
          https://sabzfaraz.ir/api/torob/v1/orders
        </code>
      </div>
    </div>
  );
}