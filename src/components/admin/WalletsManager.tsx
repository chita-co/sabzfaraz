"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Search, AlertTriangle, Loader2 } from "lucide-react";
import { adjustUserWallet } from "@/app/admin/finance/wallets/actions";

export interface WalletUserRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  balance: number;
  mismatch: boolean;
}

// تبدیل ارقام فارسی/عربی و حذف جداکننده‌ها از مبلغ تایپ‌شده
function parseAmount(input: string): number {
  const latin = input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,\u066C\u060C\s]/g, "");
  return /^\d+$/.test(latin) ? Number(latin) : NaN;
}

const PAGE = 100;

export default function WalletsManager({
  users, adminName, adminBalance,
}: { users: WalletUserRow[]; adminName: string | null; adminBalance: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [target, setTarget] = useState<WalletUserRow | null>(null);
  const [mode, setMode] = useState<"ADD" | "DEDUCT">("ADD");
  const [amountText, setAmountText] = useState("");
  const [reason, setReason] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const amount = parseAmount(amountText);
  const amountValid = Number.isSafeInteger(amount) && amount > 0;

  function openModal(u: WalletUserRow, m: "ADD" | "DEDUCT") {
    setTarget(u);
    setMode(m);
    setAmountText("");
    setReason("");
    setError(null);
    setKey(crypto.randomUUID());
  }

  function closeModal() {
    if (loading) return;
    setTarget(null);
  }

  async function submit() {
    if (!target || loading) return;
    setError(null);
    if (!amountValid) return setError("مبلغ را به‌صورت عدد صحیح وارد کنید.");
    if (reason.trim().length < 3) return setError("دلیل عملیات را بنویسید (حداقل ۳ حرف).");
    if (mode === "ADD" && amount > adminBalance) return setError("موجودی کیف پول ادمین برای این مبلغ کافی نیست.");
    if (mode === "DEDUCT" && amount > target.balance) return setError("موجودی کاربر برای این مبلغ کافی نیست.");

    const msg = mode === "ADD"
      ? `${amount.toLocaleString("fa-IR")} تومان به کیف پول «${target.name ?? "کاربر"}» اضافه شود؟`
      : `${amount.toLocaleString("fa-IR")} تومان از کیف پول «${target.name ?? "کاربر"}» کسر شود؟`;
    if (!confirm(msg)) return;

    setLoading(true);
    const res = await adjustUserWallet({
      targetUserId: target.id, action: mode, amount, reason: reason.trim(), idempotencyKey: key,
    });
    setLoading(false);

    if ("error" in res) return setError(res.error);

    setNotice(`عملیات با موفقیت ثبت شد${res.ref ? ` (کد پیگیری ${res.ref})` : ""}.`);
    setTarget(null);
    router.refresh();
  }

  const previewUser = target ? (mode === "ADD" ? target.balance + (amountValid ? amount : 0) : target.balance - (amountValid ? amount : 0)) : 0;
  const previewAdmin = mode === "ADD" ? adminBalance - (amountValid ? amount : 0) : adminBalance + (amountValid ? amount : 0);

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>کیف پول ادمین{adminName ? ` (${adminName})` : ""}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#15803d" }}>{adminBalance.toLocaleString("fa-IR")} <small style={{ fontSize: 12 }}>تومان</small></div>
        </div>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 360 }}>
          <Search size={15} style={{ position: "absolute", right: 12, top: 12, color: "#9ca3af" }} />
          <input
            className="admin-input"
            style={{ paddingRight: 34 }}
            placeholder="جستجوی نام، موبایل یا ایمیل..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
          />
        </div>
      </div>

      {notice && (
        <div className="badge badge-success" style={{ display: "block", padding: 10, marginBottom: 12 }} onClick={() => setNotice(null)}>
          {notice}
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>کاربر</th><th>موبایل</th><th>اعتبار کیف پول (تومان)</th><th>عملیات</th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((u) => (
              <tr key={u.id}>
                <td>
                  {u.name ?? "—"}
                  {u.email && <div className="text-xs text-gray-400" dir="ltr">{u.email}</div>}
                  {u.mismatch && (
                    <div className="text-xs" style={{ color: "#b91c1c", display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={12} /> مغایرت موجودی با تراکنش‌ها
                    </div>
                  )}
                </td>
                <td dir="ltr">{u.phone ?? "—"}</td>
                <td className="font-bold">{u.balance.toLocaleString("fa-IR")}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" className="admin-btn admin-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => openModal(u, "ADD")}>
                      <Plus size={14} /> افزودن مبلغ
                    </button>
                    <button type="button" className="admin-btn admin-btn-danger" style={{ display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => openModal(u, "DEDUCT")} disabled={u.balance <= 0}>
                      <Minus size={14} /> کسر مبلغ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-sm text-center py-6">کاربری پیدا نشد.</p>}
        {filtered.length > limit && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setLimit((l) => l + PAGE)}>
              نمایش بیشتر ({(filtered.length - limit).toLocaleString("fa-IR")} کاربر دیگر)
            </button>
          </div>
        )}
      </div>

      {target && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, marginBottom: 4 }}>{mode === "ADD" ? "افزودن مبلغ به کیف پول" : "کسر مبلغ از کیف پول"}</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>
              {target.name ?? "کاربر"} — موجودی فعلی: <b>{target.balance.toLocaleString("fa-IR")}</b> تومان
            </p>

            <div className="admin-form-group">
              <label>مبلغ (تومان)</label>
              <input className="admin-input" inputMode="numeric" dir="ltr" value={amountText} onChange={(e) => setAmountText(e.target.value)} placeholder="مثلاً 500000" autoFocus />
              {amountValid && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{amount.toLocaleString("fa-IR")} تومان</div>}
            </div>

            <div className="admin-form-group">
              <label>دلیل عملیات (در تاریخچه ثبت می‌شود)</label>
              <input className="admin-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="مثلاً: جبران خسارت سفارش ..." />
            </div>

            {amountValid && (
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 12, lineHeight: 1.9 }}>
                <div>{mode === "ADD" ? "از کیف پول ادمین به کاربر" : "از کیف پول کاربر به ادمین"} منتقل می‌شود.</div>
                <div>موجودی کاربر پس از عملیات: <b>{previewUser.toLocaleString("fa-IR")}</b></div>
                <div>موجودی ادمین پس از عملیات: <b>{previewAdmin.toLocaleString("fa-IR")}</b></div>
              </div>
            )}

            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className={`admin-btn ${mode === "ADD" ? "admin-btn-primary" : "admin-btn-danger"}`} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }} onClick={submit} disabled={loading}>
                {loading && <Loader2 size={15} className="animate-spin" />} ثبت
              </button>
              <button type="button" className="admin-btn admin-btn-secondary" style={{ flex: 1 }} onClick={closeModal} disabled={loading}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}