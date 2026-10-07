"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendIdentityRequestSmsAction } from "@/app/admin/users/identity-actions";

export default function SendIdentitySmsButton({
  userId,
  lastSentAt,
}: {
  userId: string;
  lastSentAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("پیامک درخواست تکمیل اطلاعات/احراز هویت برای این کاربر ارسال شود؟")) return;
    setLoading(true);
    const res = await sendIdentityRequestSmsAction(userId);
    setLoading(false);
    if (res?.error) return alert(res.error);
    alert("پیامک با موفقیت ارسال شد.");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="admin-btn admin-btn-primary"
      >
        {loading ? "در حال ارسال..." : "پیامک احراز هویت"}
      </button>
      {lastSentAt && (
        <span className="text-xs text-gray-500">
          آخرین ارسال: {new Date(lastSentAt).toLocaleString("fa-IR")}
        </span>
      )}
    </div>
  );
}