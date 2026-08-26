import { createAdminClient } from "@/lib/supabase/admin";
import { approveCategoryRequestAction, rejectCategoryRequestAction } from "../actions";
import CategoryManagerClient from "@/components/admin/blog/CategoryManagerClient";

export default async function AdminBlogCategoriesPage() {
  const admin = createAdminClient();
  const [{ data: categories }, { data: requests }, { data: unassignedPosts }] = await Promise.all([
    admin.from("blog_categories").select("*").order("name"),
    admin.from("blog_category_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    admin.from("blog_posts").select("id, title, pending_category_name").not("pending_category_name", "is", null),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>دسته‌بندی‌های بلاگ</h1>

      {!!requests?.length && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>درخواست‌های دسته‌بندی جدید از ربات</h3>
          {requests.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div><strong>{r.name}</strong>{r.description && <p style={{ fontSize: 12, color: "#6b7280" }}>{r.description}</p>}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <form action={async () => { "use server"; await approveCategoryRequestAction(r.id); }}>
                  <button className="admin-btn admin-btn-primary" style={{ padding: "6px 14px", fontSize: 12 }}>تأیید به‌عنوان دسته جدید</button>
                </form>
                <form action={async () => { "use server"; await rejectCategoryRequestAction(r.id); }}>
                  <button className="admin-btn" style={{ padding: "6px 14px", fontSize: 12, background: "#fee2e2", color: "#dc2626" }}>رد</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryManagerClient categories={categories ?? []} unassignedPosts={unassignedPosts ?? []} />
    </div>
  );
}