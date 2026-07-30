import { createClient } from "@/lib/supabase/server";
import { Shield, User } from "lucide-react";

export default async function RolesPage() {
  const supabase = await createClient();
  const [{ count: adminCount }, { count: userCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "ADMIN"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "USER"),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">نقش‌های کاربری</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="admin-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: "#eab308" }}><Shield size={20} /></div>
            <div>
              <h2 className="font-bold text-gray-800">مدیر (ADMIN)</h2>
              <p className="text-xs text-gray-500">{(adminCount ?? 0).toLocaleString("fa-IR")} حساب</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-7">
            دسترسی کامل به پنل مدیریت شامل محصولات، دسته‌بندی‌ها، سفارش‌ها، کاربران، تنظیمات مالی و پشتیبان‌گیری.
          </p>
        </div>
        <div className="admin-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="stat-icon" style={{ background: "#16a34a" }}><User size={20} /></div>
            <div>
              <h2 className="font-bold text-gray-800">کاربر عادی (USER)</h2>
              <p className="text-xs text-gray-500">{(userCount ?? 0).toLocaleString("fa-IR")} حساب</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-7">
            فقط دسترسی به فروشگاه: خرید، سبد خرید، علاقه‌مندی، پیگیری سفارش و ثبت نظر. بدون دسترسی به پنل مدیریت.
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4">
        برای تغییر نقش هر کاربر، از «مدیریت کاربران» وارد جزئیات همان کاربر شوید.
      </p>
    </div>
  );
}