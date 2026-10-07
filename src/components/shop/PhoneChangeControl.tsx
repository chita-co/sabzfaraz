"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPhoneChangeOtp, confirmPhoneChange } from "@/app/(shop)/profile/actions";
import { toEnglishDigits } from "@/lib/nationalId";

// توجه: این کامپوننت <form> ندارد (داخل فرم پروفایل قرار می‌گیرد) و فقط از دکمه‌های type="button" استفاده می‌کند.
export default function PhoneChangeControl() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [newPhone, setNewPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setStep("phone");
    setNewPhone("");
    setCode("");
    setError(null);
  }

  async function sendCode() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await requestPhoneChangeOtp(newPhone);
    setLoading(false);
    if ("error" in res) return setError(res.error);
    setStep("code");
  }

  async function confirm() {
    setError(null);
    setLoading(true);
    const res = await confirmPhoneChange(newPhone, code);
    setLoading(false);
    if ("error" in res) return setError(res.error);
    reset();
    setSuccess("شماره موبایل با موفقیت تغییر کرد. در صورت نیاز، احراز هویت را دوباره انجام دهید.");
    router.refresh();
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setSuccess(null); }}
          className="text-xs text-green-600 hover:underline"
        >
          تغییر شماره موبایل
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          {step === "phone" ? (
            <>
              <label className="block text-xs text-gray-600">شماره موبایل جدید</label>
              <input
                type="tel"
                dir="ltr"
                inputMode="numeric"
                maxLength={11}
                value={newPhone}
                onChange={(e) => setNewPhone(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 11))}
                placeholder="09123456789"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={loading || newPhone.length !== 11}
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "در حال ارسال..." : "ارسال کد تایید"}
                </button>
                <button type="button" onClick={reset} className="text-xs text-gray-500 hover:underline">
                  انصراف
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-600">
                کد ۶ رقمی ارسال‌شده به <span dir="ltr">{newPhone}</span> را وارد کنید (۲ دقیقه اعتبار دارد).
              </p>
              <input
                type="text"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 6))}
                placeholder="------"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest text-center"
              />
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={confirm}
                  disabled={loading || code.length !== 6}
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "در حال بررسی..." : "تایید و تغییر شماره"}
                </button>
                <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(null); }} className="text-xs text-gray-500 hover:underline">
                  ویرایش شماره
                </button>
              </div>
            </>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
      {success && <p className="text-xs text-green-600 mt-1">{success}</p>}
    </div>
  );
}