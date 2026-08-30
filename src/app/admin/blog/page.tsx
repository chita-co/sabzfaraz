import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { updatePostStatusAction, triggerBlogBotAction } from "./actions";
import { Sparkles, PenSquare, Lightbulb } from "lucide-react";

const statusLabel: Record<string, string> = { draft: "پیش‌نویس", pending_review: "در انتظار بررسی", published: "منتشرشده", rejected: "رد شده" };
const statusBadge: Record<string, string> = { draft: "badge-info", pending_review: "badge-warning", published: "badge-success", rejected: "badge-danger" };
const PAGE_SIZE = 20;

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const admin = createAdminClient();

  let query = admin
    .from("blog_posts")
    .select("id, title, slug, status, ai_generated, view_count, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: posts, count } = await query.range(from, to);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const { data: botSettings } = await admin.from("blog_bot_settings").select("is_running, rate_limited_until, last_run_summary").eq("id", 1).single();
  const { count: pendingCategoryCount } = await admin.from("blog_category_requests").select("id", { count: "exact", head: true }).eq("status", "pending");

  async function runBot() {
    "use server";
    await triggerBlogBotAction();
  }

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/admin/blog?${params.toString()}`;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>مقالات بلاگ</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/admin/blog/new" className="admin-btn" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PenSquare size={16} /> افزودن مقاله دستی
          </Link>
          <Link href="/admin/blog/suggest" className="admin-btn" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lightbulb size={16} /> پیشنهاد مقاله به ربات
          </Link>
          <form action={runBot}>
            <button type="submit" className="admin-btn admin-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={16} /> اجرای دستی ربات تولید محتوا
            </button>
          </form>
        </div>
      </div>

      {botSettings?.is_running && (
        <div className="blog-bot-status running">🟢 ربات همین الان در حال نوشتن مقاله است...</div>
      )}
      {!botSettings?.is_running && botSettings?.rate_limited_until && new Date(botSettings.rate_limited_until) > new Date() && (
        <div className="blog-bot-status limited">🟠 سهمیه‌ی رایگان هوش مصنوعی تا {new Date(botSettings.rate_limited_until).toLocaleString("fa-IR")} محدود است.</div>
      )}

      {!!pendingCategoryCount && pendingCategoryCount > 0 && (
        <Link href="/admin/blog/categories" className="support-faq-banner" style={{ marginBottom: 16 }}>
          {pendingCategoryCount} درخواست دسته‌بندی قدیمی هنوز در انتظار بررسی است.
        </Link>
      )}

      <div className="admin-filters-bar">
        {["", "pending_review", "published", "draft", "rejected"].map((s) => (
          <Link key={s || "all"} href={s ? `/admin/blog?status=${s}` : "/admin/blog"} className={`order-tab${(status ?? "") === s ? " active" : ""}`}>
            {s ? statusLabel[s] : "همه"}
          </Link>
        ))}
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>عنوان</th><th>وضعیت</th><th>منبع</th><th>بازدید</th><th>تاریخ</th><th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td><span className={`badge ${statusBadge[p.status]}`}>{statusLabel[p.status]}</span></td>
                <td>{p.ai_generated ? "هوش مصنوعی" : "دستی"}</td>
                <td>{(p.view_count ?? 0).toLocaleString("fa-IR")}</td>
                <td>{new Date(p.created_at).toLocaleDateString("fa-IR")}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <Link href={`/admin/blog/${p.id}`} className="admin-btn" style={{ padding: "5px 10px", fontSize: 12 }}>ویرایش</Link>
                  {p.status !== "published" && (
                    <form action={async () => { "use server"; await updatePostStatusAction(p.id, "published"); }}>
                      <button className="admin-btn admin-btn-primary" style={{ padding: "5px 10px", fontSize: 12 }}>انتشار</button>
                    </form>
                  )}
                  {p.status !== "rejected" && (
                    <form action={async () => { "use server"; await updatePostStatusAction(p.id, "rejected"); }}>
                      <button className="admin-btn" style={{ padding: "5px 10px", fontSize: 12, background: "#fee2e2", color: "#dc2626" }}>رد</button>
                    </form>
                  )}
                  {p.status === "published" && (
                    <Link href={`/blog/${p.slug}`} target="_blank" className="admin-btn" style={{ padding: "5px 10px", fontSize: 12 }}>مشاهده</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!posts || posts.length === 0) && <p className="text-gray-500 text-sm text-center py-6">مقاله‌ای یافت نشد.</p>}
      </div>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <Link href={pageHref(Math.max(1, page - 1))} className={`pagination-arrow${page <= 1 ? " disabled" : ""}`}>‹</Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, i, arr) => (
              <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && arr[i - 1] !== p - 1 && <span className="pagination-dots">...</span>}
                <Link href={pageHref(p)} className={`pagination-page${p === page ? " active" : ""}`}>{p.toLocaleString("fa-IR")}</Link>
              </span>
            ))}
          <Link href={pageHref(Math.min(totalPages, page + 1))} className={`pagination-arrow${page >= totalPages ? " disabled" : ""}`}>›</Link>
        </div>
      )}
    </div>
  );
}