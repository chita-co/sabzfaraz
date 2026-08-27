import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MessageCircle } from "lucide-react";

const statusLabels: Record<string, string> = { OPEN: "باز", CLOSED: "بسته‌شده" };

// نوع دقیق برای تیکت‌های دریافت‌شده
type TicketRow = {
  id: string;
  subject: string;
  status: string;
  updated_at: string;
  user_full_name: string | null;
  is_unread: boolean;
};

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: tickets } = await supabase.rpc("get_admin_support_tickets_with_unread");

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">پشتیبانی کاربران</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>کاربر</th>
              <th>موضوع</th>
              <th>وضعیت</th>
              <th>آخرین بروزرسانی</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).map((t: TicketRow) => (
              <tr key={t.id}>
                <td style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {t.is_unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />}
                  {t.user_full_name ?? "—"}
                </td>
                <td>{t.subject}</td>
                <td>
                  <span
                    className={
                      t.status === "OPEN"
                        ? "badge badge-success"
                        : "badge badge-info"
                    }
                  >
                    {statusLabels[t.status]}
                  </span>
                </td>
                <td className="text-xs text-gray-500">
                  {new Date(t.updated_at).toLocaleString("fa-IR")}
                </td>
                <td>
                  <Link
                    href={`/admin/support/${t.id}`}
                    className="admin-btn admin-btn-secondary flex items-center gap-1"
                  >
                    <MessageCircle size={14} /> مشاهده
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!tickets || tickets.length === 0) && (
          <p className="text-gray-500 text-sm text-center py-6">
            هنوز پیامی از کاربران دریافت نشده.
          </p>
        )}
      </div>
    </div>
  );
}