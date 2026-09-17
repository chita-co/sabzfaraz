"use client";

import { useState } from "react";
import Link from "next/link";
import SendSupportMessageButton from "./SendSupportMessageButton";
import { issueBulkDiscountCodes } from "@/app/admin/users/bulk-discount-actions";

export interface UserRow {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
}

export default function UsersTable({ users }: { users: UserRow[] }) {
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState("");
  const [days, setDays] = useState("");
  const [sending, setSending] = useState(false);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(selected.size === users.length ? new Set() : new Set(users.map((u) => u.id)));
  }

  async function handleSend() {
    const p = Number(percent);
    const d = Number(days);
    if (selected.size === 0) return alert("حداقل یک کاربر را انتخاب کنید.");
    if (!p || p <= 0 || p > 100) return alert("درصد تخفیف را درست وارد کنید (۱ تا ۱۰۰).");
    if (!d || d <= 0) return alert("مدت اعتبار (روز) را درست وارد کنید.");
    if (!confirm(`کد تخفیف ${p}% به مدت ${d} روز برای ${selected.size.toLocaleString("fa-IR")} کاربر ساخته و پیامک شود؟`)) return;

    setSending(true);
    const res = await issueBulkDiscountCodes(Array.from(selected), p, d);
    setSending(false);

    if (res?.error) return alert(res.error);

    const okCount = res.results?.filter((r) => r.success).length ?? 0;
    const failCount = (res.results?.length ?? 0) - okCount;
    if (failCount) console.log("نتیجه‌ی کامل ارسال کد تخفیف گروهی:", res.results);
    alert(`${okCount.toLocaleString("fa-IR")} پیامک با موفقیت ارسال شد.` + (failCount ? ` ${failCount.toLocaleString("fa-IR")} مورد ناموفق بود (جزئیات در کنسول مرورگر).` : ""));

    setPercent("");
    setDays("");
    setSelected(new Set());
  }

  return (
    <div className="admin-card">
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={bulkMode}
          onChange={() => { setBulkMode((v) => !v); setSelected(new Set()); }}
        />
        تخفیف گروهی
      </label>

      {bulkMode && (
        <div className="bulk-toolbar items-end" style={{ marginBottom: 16 }}>
          <span>{selected.size.toLocaleString("fa-IR")} کاربر انتخاب شده</span>
          <input
            type="number" min={1} max={100} value={percent}
            onChange={(e) => setPercent(e.target.value)}
            placeholder="درصد تخفیف" className="admin-input" style={{ maxWidth: 130 }} disabled={sending}
          />
          <input
            type="number" min={1} value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="مدت اعتبار (روز)" className="admin-input" style={{ maxWidth: 150 }} disabled={sending}
          />
          <button type="button" onClick={handleSend} disabled={sending || selected.size === 0} className="admin-btn admin-btn-primary">
            {sending ? "در حال ارسال..." : "ساخت کد و ارسال پیامک"}
          </button>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            {bulkMode && (
              <th>
                <input type="checkbox" checked={selected.size === users.length && users.length > 0} onChange={toggleAll} />
              </th>
            )}
            <th>نام</th>
            <th>ایمیل</th>
            <th>تلفن</th>
            <th>نقش</th>
            <th>تاریخ عضویت</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              {bulkMode && (
                <td>
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} />
                </td>
              )}
              <td>{u.fullName ?? "—"}</td>
              <td dir="ltr" className="text-left">{u.email ?? "—"}</td>
              <td>{u.phone ?? "—"}</td>
              <td>
                <span className={u.role === "ADMIN" ? "text-yellow-600 text-xs font-bold" : "text-gray-500 text-xs"}>
                  {u.role === "ADMIN" ? "مدیر" : "کاربر عادی"}
                </span>
              </td>
              <td className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</td>
              <td>
                <div className="flex gap-2">
                  <Link href={`/admin/users/${u.id}`} className="admin-btn admin-btn-secondary">جزئیات</Link>
                  <SendSupportMessageButton userId={u.id} userName={u.fullName ?? "کاربر"} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">هنوز کاربری ثبت‌نام نکرده است.</p>
      )}
    </div>
  );
}