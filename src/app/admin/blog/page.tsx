import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { updatePostStatusAction, triggerBlogBotAction } from "./actions";
import { Sparkles } from "lucide-react";

const statusLabel: Record<string, string> = { draft: "پیش‌نویس", pending_review: "در انتظار بررسی", published: "منتشرشده", rejected: "رد شده" };
const statusBadge: Record<string, string> = { draft: "badge-info", pending_review: "badge-warning", published: "badge-success", rejected: "badge-danger" };

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("blog_posts").select("id, title, slug, status, ai_generated, view_count, created_at").order("created_at", { ascending: false }).limit(60);
  if (status) query = query.eq("status", status);
  const { data: posts } = await query;

  const { count: pendingCategoryCount } = await admin.from("blog_category_requests").select("id", { count: "exact", head: true }).eq("status", "pending");

  async function runBot() {
    "use server";
    await triggerBlogBotAction();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>مقالات بلاگ</h1>
        <form action={runBot}>
          <button type="submit" className="admin-btn admin-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={16} /> اجرای دستی ربات تولید محتوا
          </button>
        </form>
      </div>

      {!!pendingCategoryCount && pendingCategoryCount > 0 && (
        <Link href="/admin/blog/categories" className="support-faq-banner" style={{ marginBottom: 16 }}>
          {pendingCategoryCount} درخواست دسته‌بندی جدید از طرف ربات در انتظار بررسی است.
        </Link>
      )}

      <div className="admin-filters-bar">
        {["", "pending_review", "published", "draft", "rejected"].map((s) => (
          <Link key={s || "all"} href={s ? `/admin/blog?status=${s}` : "/admin/blog"} className={`order-tab${status === s || (!status && !s) ? " active" : ""}`}>
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
      </div>
    </div>
  );
}