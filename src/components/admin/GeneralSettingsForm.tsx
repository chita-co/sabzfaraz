"use client";

import { useState } from "react";
import DynamicListInput from "./DynamicListInput";
import { updateGeneralSettings } from "@/app/admin/settings/actions";

export default function GeneralSettingsForm({
  initial,
}: {

  initial: {
    store_name: string;
    support_phone: string | null;
    support_phone_2: string | null;
    support_email: string | null;
    store_address: string | null;
    about_content: string | null;
    min_order_amount: number;
    store_postal_code: string | null;
    unboxing_whatsapp_number: string | null;
    unboxing_telegram_id: string | null;
    unboxing_instagram_handle: string | null;
    extra_phones: string[];
    extra_emails: string[];
  };
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    await updateGeneralSettings(formData);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 520 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-6">تنظیمات عمومی فروشگاه</h1>

      <div className="admin-form-group">
        <label>نام فروشگاه</label>
        <input type="text" name="storeName" defaultValue={initial.store_name} required />
      </div>
      <div className="admin-form-group">
        <label>تلفن دوم (اختیاری — روی فاکتور و پیش‌فاکتور هم نمایش داده می‌شود)</label>
        <input type="text" name="supportPhone2" dir="ltr" defaultValue={initial.support_phone_2 ?? ""} placeholder="021-11111111" />
      </div>

      <div className="admin-form-group">
        <label>کدپستی فروشگاه (برای برچسب مرسوله)</label>
        <input type="text" name="storePostalCode" dir="ltr" defaultValue={initial.store_postal_code ?? ""} placeholder="1234567890" />
      </div>

      <div className="admin-form-group">
        <label>تلفن پشتیبانی</label>
        <input type="text" name="supportPhone" dir="ltr" defaultValue={initial.support_phone ?? ""} placeholder="021-00000000" />
      </div>

      <DynamicListInput
        name="extraPhones"
        label="شماره تماس اضافی (نمایش زیر تلفن پشتیبانی در فوتر و صفحه تماس با ما)"
        placeholder="0912-1111111"
        initialValues={initial.extra_phones ?? []}
        type="tel"
      />

      <div className="admin-form-group">
        <label>ایمیل پشتیبانی</label>
        <input type="email" name="supportEmail" dir="ltr" defaultValue={initial.support_email ?? ""} placeholder="support@sabzfaraz.ir" />
      </div>

      <DynamicListInput
        name="extraEmails"
        label="ایمیل اضافی (نمایش زیر ایمیل پشتیبانی در فوتر و صفحه تماس با ما)"
        placeholder="sales@sabzfaraz.ir"
        initialValues={initial.extra_emails ?? []}
        type="email"
      />
      <div className="admin-form-group">
        <label>آدرس فروشگاه</label>
        <textarea name="storeAddress" rows={3} defaultValue={initial.store_address ?? ""} placeholder="ایران، تهران" />
      </div>

      <div className="admin-form-group">
        <label>حداقل مبلغ سبد خرید (تومان)</label>
        <input
          type="number"
          name="minOrderAmount"
          defaultValue={initial.min_order_amount}
          min={0}
          placeholder="مثلاً: 500000"
        />
      </div>

      <div className="admin-form-group">
        <label>شماره واتساپ برنامه آنباکس (با کد کشور، بدون + یا صفر اول، مثلاً 989123456789)</label>
        <input type="text" name="unboxingWhatsapp" dir="ltr" defaultValue={initial.unboxing_whatsapp_number ?? ""} />
      </div>
      <div className="admin-form-group">
        <label>آیدی تلگرام برنامه آنباکس</label>
        <input type="text" name="unboxingTelegram" dir="ltr" defaultValue={initial.unboxing_telegram_id ?? ""} placeholder="@SabzFaraz_Unbox" />
      </div>
      <div className="admin-form-group">
        <label>آیدی اینستاگرام برنامه آنباکس</label>
        <input type="text" name="unboxingInstagram" dir="ltr" defaultValue={initial.unboxing_instagram_handle ?? ""} placeholder="@SabzFaraz" />
      </div>

      <div className="admin-form-group">
        <label>متن صفحه‌ی «درباره ما»</label>
        <textarea
          name="aboutContent"
          rows={6}
          defaultValue={initial.about_content ?? ""}
          placeholder="هر متنی اینجا بنویسید، دقیقاً همین متن در صفحه‌ی درباره‌ی ما نمایش داده می‌شود."
        />
      </div>

      {saved && <p className="text-green-600 text-sm mb-3">ذخیره شد — در فوتر و صفحه‌ی تماس با ما به‌روز شد.</p>}

      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </form>
  );
}