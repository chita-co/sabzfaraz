// src/app/admin/users/page.tsx
import UsersTable from "@/components/admin/UsersTable";
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

  const users = (profiles ?? []).map((p) => {
    const em = emailMap.get(p.id);
    return {
      id: p.id,
      fullName: p.full_name ?? null,
      email: em?.endsWith("@sabzfaraz-users.ir") ? null : em ?? null,
      phone: p.phone ?? null,
      role: p.role,
      createdAt: p.created_at,
    };
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">مدیریت کاربران</h1>

      <UsersTable users={users} />
    </div>
  );
}