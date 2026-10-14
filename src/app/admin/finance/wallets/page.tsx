import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WalletsManager, { type WalletUserRow } from "@/components/admin/WalletsManager";

export const dynamic = "force-dynamic";

const BIG_ADJUST = 5_000_000;      // مبلغ بالای این عدد در تاریخچه «مبلغ بالا» علامت می‌خورد
const BIG_TX = 10_000_000;         // تراکنش‌های کیف پول بالاتر از این عدد در بخش پایش نمایش داده می‌شوند

interface Adjustment {
  id: string; admin_id: string; target_user_id: string; action: "ADD" | "DEDUCT"; amount: number; reason: string;
  admin_balance_before: number | null; admin_balance_after: number | null;
  user_balance_before: number | null; user_balance_after: number | null;
  ip: string | null; user_agent: string | null; created_at: string;
}

function tehranHour(iso: string): number {
  const h = new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", hour12: false });
  return Number(h) % 24;
}

export default async function AdminWalletsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const isHistory = tab === "history";

  // کنترل دسترسی سمت سرور (علاوه بر layout)
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await session.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "ADMIN") redirect("/");

  const admin = createAdminClient();

  const tabs = (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      <Link href="/admin/finance/wallets" className={`admin-btn ${!isHistory ? "admin-btn-primary" : "admin-btn-secondary"}`}>لیست کیف پول‌ها</Link>
      <Link href="/admin/finance/wallets?tab=history" className={`admin-btn ${isHistory ? "admin-btn-primary" : "admin-btn-secondary"}`}>تاریخچه و پایش امنیتی</Link>
    </div>
  );

  /* ===================== تب ۱: لیست کیف پول‌ها ===================== */
  if (!isHistory) {
    const [{ data: profiles }, { data: authData }, { data: mismatchRows }] = await Promise.all([
      admin.from("profiles").select("id, full_name, phone, role, wallet_balance, created_at").order("wallet_balance", { ascending: false }).limit(5000),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.rpc("wallet_mismatches"),
    ]);

    const emailMap = new Map((authData?.users ?? []).map((u) => [u.id, u.email]));
    const mismatchSet = new Set(((mismatchRows ?? []) as { user_id: string }[]).map((m) => m.user_id));

    const all = profiles ?? [];
    // کیف پول ادمین = قدیمی‌ترین ادمین (همان که درآمد سفارش‌های کیف‌پولی به او واریز می‌شود)
    const storeAdmin = all
      .filter((p) => p.role === "ADMIN")
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))[0];
    const totalAll = all.reduce((s, p) => s + Number(p.wallet_balance ?? 0), 0);

    const rows: WalletUserRow[] = all
      .filter((p) => p.id !== storeAdmin?.id)
      .map((p) => {
        const em = emailMap.get(p.id);
        return {
          id: p.id,
          name: p.full_name ?? null,
          phone: p.phone ?? null,
          email: em && !em.endsWith("@sabzfaraz-users.ir") ? em : null,
          balance: Number(p.wallet_balance ?? 0),
          mismatch: mismatchSet.has(p.id),
        };
      });

    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={20} className="text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">لیست کیف پول‌ها</h1>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          مجموع اعتبار همه‌ی کیف پول‌ها: <b>{totalAll.toLocaleString("fa-IR")} تومان</b> — تعداد کاربران: {rows.length.toLocaleString("fa-IR")}
        </p>
        {tabs}
        <WalletsManager users={rows} adminName={storeAdmin?.full_name ?? null} adminBalance={Number(storeAdmin?.wallet_balance ?? 0)} />
      </div>
    );
  }

  /* ===================== تب ۲: تاریخچه و پایش ===================== */
  // eslint-disable-next-line react-hooks/purity -- این صفحه فقط سمت سرور اجرا می‌شود و بازه‌ی ۳۰ روزه‌ی گزارش را از زمان واقعی می‌گیرد
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: adjRows }, { data: mismatchRows }, { data: recentTx }] = await Promise.all([
    admin.from("admin_wallet_adjustments").select("*").order("created_at", { ascending: false }).limit(300),
    admin.rpc("wallet_mismatches"),
    admin.from("wallet_transactions").select("id, user_id, type, amount, balance_after, description, created_at")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(1000),
  ]);

  const adjustments = (adjRows ?? []) as Adjustment[];
  const mismatches = (mismatchRows ?? []) as { user_id: string; wallet_balance: number; last_balance_after: number | null; last_tx_at: string | null }[];
  const bigTx = (recentTx ?? []).filter((t) => Math.abs(Number(t.amount)) >= BIG_TX).slice(0, 30);

  // دو کوئری جدا + نگاشت دستی
  const ids = new Set<string>();
  adjustments.forEach((a) => { ids.add(a.admin_id); ids.add(a.target_user_id); });
  mismatches.forEach((m) => ids.add(m.user_id));
  bigTx.forEach((t) => ids.add(t.user_id));
  const { data: nameRows } = ids.size
    ? await admin.from("profiles").select("id, full_name, phone").in("id", Array.from(ids))
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] };
  const nameMap = new Map((nameRows ?? []).map((p) => [p.id, p]));
  const nm = (id: string) => nameMap.get(id)?.full_name ?? "—";

  // علامت‌گذاری موارد مشکوک
  function flagsFor(a: Adjustment): string[] {
    const f: string[] = [];
    if (Number(a.amount) >= BIG_ADJUST) f.push("مبلغ بالا");
    const t = new Date(a.created_at).getTime();
    const burst = adjustments.filter((b) =>
      b.admin_id === a.admin_id && b.target_user_id === a.target_user_id && Math.abs(new Date(b.created_at).getTime() - t) <= 10 * 60 * 1000
    ).length;
    if (burst >= 3) f.push("تکرار پشت‌سرهم");
    const hr = tehranHour(a.created_at);
    if (hr >= 0 && hr < 5) f.push("ساعت غیرعادی");
    return f;
  }

  const added30 = adjustments.filter((a) => a.action === "ADD" && a.created_at >= since).reduce((s, a) => s + Number(a.amount), 0);
  const deducted30 = adjustments.filter((a) => a.action === "DEDUCT" && a.created_at >= since).reduce((s, a) => s + Number(a.amount), 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={20} className="text-green-600" />
        <h1 className="text-xl font-bold text-gray-900">تاریخچه و پایش امنیتی کیف پول</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        ۳۰ روز اخیر — مجموع افزوده‌شده توسط ادمین: <b>{added30.toLocaleString("fa-IR")}</b> تومان | مجموع کسرشده: <b>{deducted30.toLocaleString("fa-IR")}</b> تومان
      </p>
      {tabs}

      {/* مغایرت موجودی */}
      <div className="admin-card" style={{ marginBottom: 16, borderRight: mismatches.length ? "4px solid #dc2626" : "4px solid #16a34a" }}>
        <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          {mismatches.length > 0 && <AlertTriangle size={16} color="#dc2626" />} مغایرت موجودی با تراکنش‌ها
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          اگر موجودی یک کیف پول با «مانده پس از آخرین تراکنش» برابر نباشد، یعنی موجودی بدون ثبت تراکنش تغییر کرده (ممکن است دستکاری مستقیم دیتابیس یا نفوذ باشد؛ البته کیف پول‌هایی که قبل از ثبت دفتر تراکنش‌ها دستی تغییر کرده‌اند هم اینجا دیده می‌شوند).
        </p>
        {mismatches.length === 0 ? (
          <p className="text-sm text-green-700">هیچ مغایرتی پیدا نشد ✅</p>
        ) : (
          <table className="admin-table">
            <thead><tr><th>کاربر</th><th>موبایل</th><th>موجودی فعلی</th><th>مانده آخرین تراکنش</th><th>اختلاف</th><th>آخرین تراکنش</th></tr></thead>
            <tbody>
              {mismatches.map((m) => {
                const diff = Number(m.wallet_balance) - Number(m.last_balance_after ?? 0);
                return (
                  <tr key={m.user_id}>
                    <td>{nm(m.user_id)}</td>
                    <td dir="ltr">{nameMap.get(m.user_id)?.phone ?? "—"}</td>
                    <td>{Number(m.wallet_balance).toLocaleString("fa-IR")}</td>
                    <td>{m.last_balance_after == null ? "—" : Number(m.last_balance_after).toLocaleString("fa-IR")}</td>
                    <td className={diff >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"} dir="ltr">{diff.toLocaleString("fa-IR")}</td>
                    <td className="text-xs text-gray-500">{m.last_tx_at ? new Date(m.last_tx_at).toLocaleString("fa-IR") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* تاریخچه عملیات دستی ادمین */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h2 className="font-bold text-gray-800 mb-3">عملیات دستی ادمین (افزودن / کسر)</h2>
        <table className="admin-table">
          <thead>
            <tr><th>تاریخ</th><th>ادمین</th><th>کاربر</th><th>عملیات</th><th>مبلغ</th><th>موجودی کاربر (قبل ← بعد)</th><th>دلیل</th><th>IP</th><th>هشدار</th></tr>
          </thead>
          <tbody>
            {adjustments.map((a) => {
              const flags = flagsFor(a);
              return (
                <tr key={a.id} style={flags.length ? { background: "#fef2f2" } : undefined}>
                  <td className="text-xs text-gray-500">{new Date(a.created_at).toLocaleString("fa-IR")}</td>
                  <td>{nm(a.admin_id)}</td>
                  <td>{nm(a.target_user_id)} <span className="text-xs text-gray-400" dir="ltr">{nameMap.get(a.target_user_id)?.phone ?? ""}</span></td>
                  <td><span className={`badge ${a.action === "ADD" ? "badge-success" : "badge-danger"}`}>{a.action === "ADD" ? "افزودن" : "کسر"}</span></td>
                  <td className={a.action === "ADD" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{Number(a.amount).toLocaleString("fa-IR")}</td>
                  <td className="text-xs">{Number(a.user_balance_before ?? 0).toLocaleString("fa-IR")} ← {Number(a.user_balance_after ?? 0).toLocaleString("fa-IR")}</td>
                  <td className="text-xs text-gray-600">{a.reason}</td>
                  <td className="text-xs text-gray-400" dir="ltr" title={a.user_agent ?? ""}>{a.ip ?? "—"}</td>
                  <td>{flags.map((f) => <span key={f} className="badge badge-warning" style={{ marginInlineEnd: 4 }}>{f}</span>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {adjustments.length === 0 && <p className="text-gray-500 text-sm text-center py-6">هنوز عملیات دستی ثبت نشده است.</p>}
      </div>

      {/* تراکنش‌های حجیم */}
      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-1">تراکنش‌های حجیم کیف پول کاربران (۳۰ روز اخیر)</h2>
        <p className="text-xs text-gray-500 mb-3">تراکنش‌های بالاتر از {BIG_TX.toLocaleString("fa-IR")} تومان؛ برای بررسی کلاهبرداری یا رفتار غیرعادی.</p>
        <table className="admin-table">
          <thead><tr><th>تاریخ</th><th>کاربر</th><th>نوع</th><th>مبلغ</th><th>مانده پس از تراکنش</th><th>شرح</th></tr></thead>
          <tbody>
            {bigTx.map((t) => (
              <tr key={t.id}>
                <td className="text-xs text-gray-500">{new Date(t.created_at).toLocaleString("fa-IR")}</td>
                <td>{nm(t.user_id)}</td>
                <td>{t.type === "credit" ? "واریز" : t.type === "debit" ? "برداشت" : t.type}</td>
                <td className={Number(t.amount) >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{Number(t.amount).toLocaleString("fa-IR")}</td>
                <td>{Number(t.balance_after).toLocaleString("fa-IR")}</td>
                <td className="text-xs text-gray-500">{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {bigTx.length === 0 && <p className="text-gray-500 text-sm text-center py-6">تراکنش حجیمی ثبت نشده است.</p>}
      </div>
    </div>
  );
}