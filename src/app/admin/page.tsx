// src/app/admin/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Users, Package, Tags, ShoppingCart } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: usersCount },
    { count: productsCount },
    { count: categoriesCount },
    { count: ordersCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "کاربران", value: usersCount ?? 0, icon: Users, color: "#3b82f6" },
    { label: "محصولات", value: productsCount ?? 0, icon: Package, color: "#16a34a" },
    { label: "دسته‌بندی‌ها", value: categoriesCount ?? 0, icon: Tags, color: "#f59e0b" },
    { label: "سفارش‌ها", value: ordersCount ?? 0, icon: ShoppingCart, color: "#8b5cf6" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">داشبورد مدیریت</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.color }}>
                <Icon size={22} />
              </div>
              <div>
                <div className="stat-value">{s.value.toLocaleString("fa-IR")}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}