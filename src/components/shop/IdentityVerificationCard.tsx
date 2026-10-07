"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { verifyIdentityAction } from "@/app/(shop)/profile/actions";
import { toEnglishDigits } from "@/lib/nationalId";

export default function IdentityVerificationCard({
  initialNationalId,
  initialVerified,
}: {
  initialNationalId: string | null;
  initialVerified: boolean;
}) {
  const [nationalId, setNationalId] = useState(initialNationalId ?? "");
  const [verified, setVerified] = useState(initialVerified);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showMismatchModal, setShowMismatchModal] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || verified) return;
    setInlineError(null);
    setSuccessMsg(null);
    setLoading(true);
    const result = await verifyIdentityAction(nationalId);
    setLoading(false);

    if ("success" in result) {
      setVerified(true);
      setNationalId(result.nationalId);
      setSuccessMsg("هویت شما با موفقیت احراز شد.");
      return;
    }
    if (result.code === "MISMATCH") {
      setShowMismatchModal(true);
      return;
    }
    setInlineError(result.error);
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">احراز هویت</h2>
          {verified ? (
            <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <ShieldCheck size={14} /> احراز شده
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <ShieldAlert size={14} /> احراز نشده
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">کد ملی</label>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              maxLength={10}
              value={nationalId}
              onChange={(e) => setNationalId(toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 10))}
              disabled={verified || loading}
              placeholder="کد ملی ۱۰ رقمی"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500"
            />
            {!verified && (
              <p className="text-xs text-gray-500 mt-1">
                کد ملی باید متعلق به صاحب شماره موبایل حساب شما باشد. تکمیل این بخش برای نهایی شدن سفارش‌ها لازم است.
              </p>
            )}
          </div>

          {inlineError && <p className="text-sm text-red-600">{inlineError}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          {!verified && (
            <button
              type="submit"
              disabled={loading || nationalId.length !== 10}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "در حال بررسی..." : "ثبت و احراز هویت"}
            </button>
          )}
        </form>
      </div>

      {showMismatchModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ShieldAlert size={26} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">عدم تطابق اطلاعات</h3>
            <p className="text-sm text-gray-600 leading-7 mb-5">
              کد ملی وارد شده با شماره موبایل این حساب مطابقت ندارد. کد ملی باید متعلق به همان شخصی باشد که شماره
              موبایل به نام اوست. لطفاً کد ملی صحیح را وارد کنید.
            </p>
            <button
              type="button"
              onClick={() => setShowMismatchModal(false)}
              className="w-full rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
}