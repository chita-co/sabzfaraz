// src/app/admin/users/page.tsx
import SendSupportMessageButton from "@/components/admin/SendSupportMessageButton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = new Map((authData?.users ?? []).map((u) => [u.id, u.email]));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">مدیریت کاربران</h1>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>ایمیل</th>
              <th>تلفن</th>
              <th>نقش</th>
              <th>تاریخ عضویت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.full_name ?? "—"}</td>
                <td dir="ltr" className="text-left">
                  {(() => {
                    const em = emailMap.get(p.id);
                    return em?.endsWith("@sabzfaraz-users.ir") ? "—" : (em ?? "—");
                  })()}
                </td>
                <td>{p.phone ?? "—"}</td>
                <td>
                  <span
                    className={
                      p.role === "ADMIN"
                        ? "text-yellow-600 text-xs font-bold"
                        : "text-gray-500 text-xs"
                    }
                  >
                    {p.role === "ADMIN" ? "مدیر" : "کاربر عادی"}
                  </span>
                </td>
                <td className="text-xs text-gray-500">
                  {new Date(p.created_at).toLocaleDateString("fa-IR")}
                </td>
                <td>
                  <div className="flex gap-2">
                  <Link
                    href={`/admin/users/${p.id}`}
                    className="admin-btn admin-btn-secondary"
                  >
                    جزئیات
                  </Link>
                  <SendSupportMessageButton userId={p.id} userName={p.full_name ?? "کاربر"} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!profiles || profiles.length === 0) && (
          <p className="text-gray-500 text-sm text-center py-6">
            هنوز کاربری ثبت‌نام نکرده است.
          </p>
        )}
      </div>
    </div>
  );
}