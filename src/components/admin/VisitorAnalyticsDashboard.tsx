"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Download, X, Radio, Eye, History, CalendarDays, CalendarRange, UserCheck, LogOut, Clock, Target, ShieldAlert } from "lucide-react";
import { countryCodeToFlagEmoji } from "@/lib/analytics/geoLookup";

interface ReportData {
  cards: {
    today: number; yesterday: number; thisWeek: number; thisMonth: number;
    uniqueVisitors: number; bounceRate: number; avgSessionSeconds: number; conversionRate: number;
    adminVisits: number;
  };
  chart: { label: string; sessions: number; uniqueVisitors: number }[];
  landingPages: { page: string; visits: number; exitRate: number }[];
  referrers: { name: string; count: number; percent: number }[];
  browsers: { name: string; count: number; percent: number }[];
  os: { name: string; count: number; percent: number }[];
  devices: { name: string; count: number; percent: number }[];
  countries: { name: string; countryCode: string | null; count: number; percent: number }[];
  recentSessions: {
    id: string; startedAt: string; landingPage: string; exitPage: string; referrerDomain: string | null;
    device: string; browser: string; os: string; source: string;
    pageCount: number; durationSeconds: number; converted: boolean;
    isGuest: boolean; isAdmin: boolean; isReturning: boolean;
    customerName: string | null; customerPhone: string | null;
    countryCode: string | null; countryName: string | null;
    searchEngine: string | null; searchKeywords: string | null;
  }[];
  totalSessions: number;
}

interface LiveSession {
  id: string; exit_page: string; device_type: string; browser: string; traffic_source: string; ended_at: string;
  user_id: string | null;
  is_admin_visit: boolean;
  country_code: string | null;
  country_name: string | null;
  profile: { full_name: string | null } | null;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toLocaleString("fa-IR")}:${s.toString().padStart(2, "0")}`;
}

function toCsv(rows: Record<string, string | number>[], headers: string[]): string {
  const bom = "\uFEFF";
  const headerLine = headers.join(",");
  const lines = rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
  return bom + [headerLine, ...lines].join("\n");
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const deviceLabel = (d: string) => (d === "mobile" ? "موبایل" : d === "tablet" ? "تبلت" : d === "desktop" ? "دسکتاپ" : d);

const SESSION_CSV_HEADERS = [
  "کاربر", "تلفن", "بازگشتی", "تاریخ شروع", "صفحه ورود", "صفحه خروج", "منبع ترافیک", "دامنه معرف",
  "دستگاه", "مرورگر", "سیستم عامل", "کشور", "موتور جستجو", "کلمات جستجو", "تعداد صفحه", "مدت حضور (ثانیه)", "خرید",
];

function buildSessionsCsvRows(sessions: ReportData["recentSessions"]) {
  return sessions.map((s) => ({
    "کاربر": s.isAdmin ? "ادمین" : s.isGuest ? "مهمان" : (s.customerName ?? "بدون نام"),
    "تلفن": s.customerPhone ?? "",
    "بازگشتی": s.isReturning ? "بله" : "خیر",
    "تاریخ شروع": new Date(s.startedAt).toLocaleString("fa-IR"),
    "صفحه ورود": s.landingPage,
    "صفحه خروج": s.exitPage,
    "منبع ترافیک": s.source,
    "دامنه معرف": s.referrerDomain ?? "",
    "دستگاه": deviceLabel(s.device),
    "مرورگر": s.browser,
    "سیستم عامل": s.os,
    "کشور": s.countryName ?? "",
    "موتور جستجو": s.searchEngine ?? "",
    "کلمات جستجو": s.searchKeywords ?? "",
    "تعداد صفحه": s.pageCount,
    "مدت حضور (ثانیه)": s.durationSeconds,
    "خرید": s.converted ? "بله" : "خیر",
  }));
}

export default function VisitorAnalyticsDashboard() {
  const [from, setFrom] = useState(daysAgoIso(7));
  const [to, setTo] = useState(todayIso());
  const [source, setSource] = useState("");
  const [device, setDevice] = useState("");
  const [converted, setConverted] = useState("");
  const [includeAdmin, setIncludeAdmin] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [drilldownId, setDrilldownId] = useState<string | null>(null);

  useEffect(() => {
  const timer = setTimeout(() => setLoading(true), 0);

  const params = new URLSearchParams({ from, to });
  if (source) params.set("source", source);
  if (device) params.set("device", device);
  if (converted) params.set("converted", converted);
  if (includeAdmin) params.set("includeAdmin", "true");

  fetch(`/api/admin/analytics/report?${params.toString()}`)
    .then((res) => res.json())
    .then((data) => setData(data))
    .catch(() => {})
    .finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });

  return () => clearTimeout(timer);
}, [from, to, source, device, converted, includeAdmin]);

  useEffect(() => {
    async function fetchLive() {
      try {
        const params = new URLSearchParams();
        if (includeAdmin) params.set("includeAdmin", "true");
        const res = await fetch(`/api/track/live?${params.toString()}`);
        const json = await res.json();
        setLiveSessions(json.sessions ?? []);
      } catch {}
    }
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, [includeAdmin]);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">آمار بازدیدکنندگان</h1>

      <div className="admin-card mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label>از تاریخ</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label>تا تاریخ</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label>منبع ترافیک</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">همه</option>
              <option value="Direct">مستقیم</option>
              <option value="Organic Search">جستجوی ارگانیک</option>
              <option value="Paid Search (Google Ads)">تبلیغات گوگل</option>
              <option value="Social">شبکه‌های اجتماعی</option>
              <option value="Torob">ترب</option>
              <option value="AI Platform">پلتفرم هوش مصنوعی</option>
              <option value="Referral">سایر ارجاع‌ها</option>
            </select>
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label>دستگاه</label>
            <select value={device} onChange={(e) => setDevice(e.target.value)}>
              <option value="">همه</option>
              <option value="mobile">موبایل</option>
              <option value="tablet">تبلت</option>
              <option value="desktop">دسکتاپ</option>
            </select>
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label>وضعیت تبدیل</label>
            <select value={converted} onChange={(e) => setConverted(e.target.value)}>
              <option value="">همه</option>
              <option value="yes">خرید انجام‌شده</option>
              <option value="no">بدون خرید</option>
            </select>
          </div>
          <div className="admin-form-group flex items-center gap-2" style={{ marginBottom: 0, alignSelf: "end" }}>
            <input type="checkbox" id="includeAdmin" checked={includeAdmin} onChange={(e) => setIncludeAdmin(e.target.checked)} />
            <label htmlFor="includeAdmin" style={{ marginBottom: 0 }}>نمایش بازدیدهای ادمین</label>
          </div>
        </div>
      </div>

      {!includeAdmin && data && data.cards.adminVisits > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          <ShieldAlert size={14} />
          {data.cards.adminVisits.toLocaleString("fa-IR")} بازدید ادمین در این بازه پنهان شده — برای دیدنشان تیک «نمایش بازدیدهای ادمین» را بزنید.
        </div>
      )}

      {loading || !data ? (
        <p className="text-gray-500 text-sm">در حال بارگذاری...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="stat-card"><div className="stat-icon" style={{ background: "#16a34a" }}><Eye size={20} /></div>
              <div><div className="stat-value">{data.cards.today.toLocaleString("fa-IR")}</div><div className="stat-label">بازدید امروز</div></div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "#3b82f6" }}><History size={20} /></div>
              <div><div className="stat-value">{data.cards.yesterday.toLocaleString("fa-IR")}</div><div className="stat-label">بازدید دیروز</div></div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "#f59e0b" }}><CalendarDays size={20} /></div>
              <div><div className="stat-value">{data.cards.thisWeek.toLocaleString("fa-IR")}</div><div className="stat-label">این هفته</div></div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "#8b5cf6" }}><CalendarRange size={20} /></div>
              <div><div className="stat-value">{data.cards.thisMonth.toLocaleString("fa-IR")}</div><div className="stat-label">این ماه</div></div></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="stat-card"><div className="stat-icon" style={{ background: "#0891b2" }}><UserCheck size={20} /></div>
              <div><div className="stat-value">{data.cards.uniqueVisitors.toLocaleString("fa-IR")}</div><div className="stat-label">بازدیدکننده یکتا (بازه)</div></div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "#dc2626" }}><LogOut size={20} /></div>
              <div><div className="stat-value">{data.cards.bounceRate.toLocaleString("fa-IR")}٪</div><div className="stat-label">نرخ پرش</div></div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "#059669" }}><Clock size={20} /></div>
              <div><div className="stat-value">{formatDuration(data.cards.avgSessionSeconds)}</div><div className="stat-label">میانگین زمان حضور</div></div></div>
            <div className="stat-card"><div className="stat-icon" style={{ background: "#d97706" }}><Target size={20} /></div>
              <div><div className="stat-value">{data.cards.conversionRate.toLocaleString("fa-IR")}٪</div><div className="stat-label">نرخ تبدیل</div></div></div>
          </div>

          <div className="admin-card mb-5">
            <h2 className="font-bold text-gray-800 mb-4">روند بازدید در بازه انتخابی</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" name="نشست‌ها" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="uniqueVisitors" name="بازدیدکننده یکتا" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-card mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio size={16} className="text-red-500" />
              <h2 className="font-bold text-gray-800">بازدیدهای فعال (۵ دقیقه اخیر)</h2>
              <span className="badge badge-success">{liveSessions.length.toLocaleString("fa-IR")} نفر آنلاین</span>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead><tr><th>کاربر</th><th>صفحه فعلی</th><th>دستگاه</th><th>مرورگر</th><th>کشور</th><th>منبع</th></tr></thead>
                <tbody>
                  {liveSessions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        {s.is_admin_visit ? (
                          <span className="badge badge-warning">ادمین</span>
                        ) : s.profile?.full_name ? (
                          s.profile.full_name
                        ) : (
                          <span className="text-gray-400">مهمان</span>
                        )}
                      </td>
                      <td dir="ltr" className="text-left text-xs">{s.exit_page}</td>
                      <td>{deviceLabel(s.device_type)}</td>
                      <td>{s.browser}</td>
                      <td className="text-xs">{s.country_code ? `${countryCodeToFlagEmoji(s.country_code)} ${s.country_name ?? s.country_code}` : "—"}</td>
                      <td>{s.traffic_source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {liveSessions.length === 0 && <p className="text-gray-500 text-sm text-center py-4">در حال حاضر بازدیدکننده‌ای آنلاین نیست.</p>}
          </div>

          <div className="admin-card mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">برترین صفحات ورودی</h2>
              <button className="admin-btn admin-btn-secondary flex items-center gap-1" onClick={() => downloadCsv(toCsv(data.landingPages, ["page", "visits", "exitRate"]), "landing-pages.csv")}>
                <Download size={13} /> CSV
              </button>
            </div>
            <table className="admin-table">
              <thead><tr><th>صفحه</th><th>تعداد ورود</th><th>نرخ خروج از همین صفحه</th></tr></thead>
              <tbody>
                {data.landingPages.map((p, i) => (
                  <tr key={i}><td dir="ltr" className="text-left text-xs">{p.page}</td><td>{p.visits.toLocaleString("fa-IR")}</td><td>{p.exitRate.toLocaleString("fa-IR")}٪</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-card mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">منابع ترافیک</h2>
              <button className="admin-btn admin-btn-secondary flex items-center gap-1" onClick={() => downloadCsv(toCsv(data.referrers, ["name", "count", "percent"]), "referrers.csv")}>
                <Download size={13} /> CSV
              </button>
            </div>
            <table className="admin-table">
              <thead><tr><th>منبع</th><th>تعداد</th><th>درصد</th></tr></thead>
              <tbody>
                {data.referrers.map((r, i) => (
                  <tr key={i}><td>{r.name}</td><td>{r.count.toLocaleString("fa-IR")}</td><td>{r.percent.toLocaleString("fa-IR")}٪</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-5">
            <div className="admin-card">
              <h2 className="font-bold text-gray-800 mb-3">مرورگرها</h2>
              <table className="admin-table"><tbody>{data.browsers.map((b, i) => (<tr key={i}><td>{b.name}</td><td>{b.percent.toLocaleString("fa-IR")}٪</td></tr>))}</tbody></table>
            </div>
            <div className="admin-card">
              <h2 className="font-bold text-gray-800 mb-3">سیستم‌عامل‌ها</h2>
              <table className="admin-table"><tbody>{data.os.map((o, i) => (<tr key={i}><td>{o.name}</td><td>{o.percent.toLocaleString("fa-IR")}٪</td></tr>))}</tbody></table>
            </div>
            <div className="admin-card">
              <h2 className="font-bold text-gray-800 mb-3">دستگاه‌ها</h2>
              <table className="admin-table"><tbody>{data.devices.map((d, i) => (<tr key={i}><td>{deviceLabel(d.name)}</td><td>{d.percent.toLocaleString("fa-IR")}٪</td></tr>))}</tbody></table>
            </div>
            <div className="admin-card">
              <h2 className="font-bold text-gray-800 mb-3">توزیع کشورها</h2>
              <table className="admin-table"><tbody>
                {data.countries.map((c, i) => (
                  <tr key={i}><td>{countryCodeToFlagEmoji(c.countryCode)} {c.name}</td><td>{c.percent.toLocaleString("fa-IR")}٪</td></tr>
                ))}
              </tbody></table>
              {data.countries.length === 0 && <p className="text-gray-400 text-xs text-center py-4">داده‌ای موجود نیست.</p>}
            </div>
          </div>

          <div className="admin-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">نشست‌های اخیر (کلیک برای مشاهده جزئیات)</h2>
              <button
                className="admin-btn admin-btn-secondary flex items-center gap-1"
                onClick={() => downloadCsv(toCsv(buildSessionsCsvRows(data.recentSessions), SESSION_CSV_HEADERS), "visitor-sessions.csv")}
              >
                <Download size={13} /> CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>کاربر</th><th>زمان شروع</th><th>صفحه ورود</th><th>معرف</th><th>منبع</th>
                    <th>دستگاه</th><th>مرورگر</th><th>سیستم‌عامل</th><th>کشور</th>
                    <th>موتور جستجو / کلمات</th><th>تعداد صفحه</th><th>مدت حضور</th><th>خرید</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSessions.map((s) => (
                    <tr key={s.id} onClick={() => setDrilldownId(s.id)} className="inline-edit-cell">
                      <td>
                        <div className="flex items-center gap-1 flex-wrap">
                          {s.isAdmin ? (
                            <span className="badge badge-warning">ادمین</span>
                          ) : s.isGuest ? (
                            <span className="badge badge-info">مهمان</span>
                          ) : (
                            <div>
                              <div className="font-medium text-gray-800">{s.customerName ?? "بدون نام"}</div>
                              {s.customerPhone && <div className="text-xs text-gray-400" dir="ltr">{s.customerPhone}</div>}
                            </div>
                          )}
                          {s.isReturning && <span className="badge badge-success" title="بازدیدکننده بازگشتی">بازگشتی</span>}
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">{new Date(s.startedAt).toLocaleString("fa-IR")}</td>
                      <td dir="ltr" className="text-left text-xs">{s.landingPage}</td>
                      <td dir="ltr" className="text-left text-xs">{s.referrerDomain ?? "—"}</td>
                      <td>{s.source}</td>
                      <td>{deviceLabel(s.device)}</td>
                      <td>{s.browser}</td>
                      <td>{s.os}</td>
                      <td className="text-xs">{s.countryCode ? `${countryCodeToFlagEmoji(s.countryCode)} ${s.countryName ?? s.countryCode}` : "—"}</td>
                      <td className="text-xs">
                        {s.searchEngine ? (
                          <div>
                            <div>{s.searchEngine}</div>
                            {s.searchKeywords && <div className="text-gray-400">«{s.searchKeywords}»</div>}
                          </div>
                        ) : "—"}
                      </td>
                      <td>{s.pageCount.toLocaleString("fa-IR")}</td>
                      <td>{formatDuration(s.durationSeconds)}</td>
                      <td>{s.converted ? <span className="badge badge-success">بله</span> : <span className="badge badge-info">خیر</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {drilldownId && <SessionDrilldownModal sessionId={drilldownId} onClose={() => setDrilldownId(null)} />}
    </div>
  );
}

interface SessionDetail {
  user_id: string | null;
  is_admin_visit: boolean;
  traffic_source: string;
  is_converted: boolean;
  browser: string;
  browser_version: string;
  os: string;
  device_type: string;
  country_code: string | null;
  country_name: string | null;
  city: string | null;
  referrer_domain: string | null;
  search_engine: string | null;
  search_keywords: string | null;
  profile: { full_name: string | null; phone: string | null } | null;
}

function SessionDrilldownModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [details, setDetails] = useState<{
    session: SessionDetail | null;
    pageviews: { id: string; page_url: string; time_on_page_seconds: number | null; viewed_at: string }[];
    conversions: { id: string; event_type: string; value: number | null; created_at: string }[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/analytics/session/${sessionId}`).then((r) => r.json()).then(setDetails);
  }, [sessionId]);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">جزئیات نشست</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {!details ? (
          <p className="text-gray-500 text-sm">در حال بارگذاری...</p>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              {details.session?.is_admin_visit ? (
                <p className="font-bold text-amber-600">بازدید ادمین</p>
              ) : details.session?.user_id ? (
                <>
                  <p className="font-bold text-gray-800">{details.session.profile?.full_name ?? "بدون نام ثبت‌شده"}</p>
                  {details.session.profile?.phone && <p className="text-xs text-gray-500" dir="ltr">{details.session.profile.phone}</p>}
                </>
              ) : (
                <p className="text-gray-500">بازدیدکننده‌ی مهمان (بدون ورود به حساب کاربری)</p>
              )}
              <p className="text-xs text-gray-500">منبع ورود: {details.session?.traffic_source} — وضعیت خرید: {details.session?.is_converted ? "خرید انجام‌شده" : "بدون خرید"}</p>
              <p className="text-xs text-gray-500">
                مرورگر: {details.session?.browser} {details.session?.browser_version} — سیستم‌عامل: {details.session?.os} — دستگاه: {deviceLabel(details.session?.device_type ?? "")}
              </p>
              {details.session?.country_name && (
                <p className="text-xs text-gray-500">
                  کشور: {countryCodeToFlagEmoji(details.session.country_code)} {details.session.country_name}
                  {details.session.city ? `، ${details.session.city}` : ""}
                </p>
              )}
              {details.session?.referrer_domain && (
                <p className="text-xs text-gray-500" dir="ltr">دامنه معرف: {details.session.referrer_domain}</p>
              )}
              {details.session?.search_engine && (
                <p className="text-xs text-gray-500">
                  موتور جستجو: {details.session.search_engine}
                  {details.session.search_keywords ? ` — «${details.session.search_keywords}»` : ""}
                </p>
              )}
            </div>

            <table className="admin-table mb-4">
              <thead><tr><th>صفحه</th><th>زمان بازدید</th><th>مدت حضور</th></tr></thead>
              <tbody>
                {details.pageviews.map((p) => (
                  <tr key={p.id}>
                    <td dir="ltr" className="text-left text-xs">{p.page_url}</td>
                    <td className="text-xs text-gray-500">{new Date(p.viewed_at).toLocaleTimeString("fa-IR")}</td>
                    <td>{p.time_on_page_seconds != null ? formatDuration(p.time_on_page_seconds) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {details.conversions.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2 text-sm">رویدادهای تبدیل</h3>
                {details.conversions.map((c) => (
                  <p key={c.id} className="text-sm text-green-700">✓ {c.event_type} — {c.value?.toLocaleString("fa-IR")} تومان — {new Date(c.created_at).toLocaleString("fa-IR")}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}