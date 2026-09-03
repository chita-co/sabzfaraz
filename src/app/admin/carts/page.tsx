import { createAdminClient } from "@/lib/supabase/admin";
import DeleteCartItemButton from "@/components/admin/DeleteCartItemButton";
import DeleteUserCartButton from "@/components/admin/DeleteUserCartButton";
import CartsCleanupButton from "@/components/admin/CartsCleanupButton";

type CartRow = {
  id: string;
  user_id: string;
  product_name: string;
  price: number;
  discount_price: number | null;
  selected_color: string | null;
  selected_size: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  profile: { full_name: string | null; phone: string | null } | null;
};

export default async function AdminCartsPage() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("cart_items")
    .select("*, profile:profiles(full_name, phone)")
    .order("updated_at", { ascending: false });

  const grouped = new Map<string, CartRow[]>();
  for (const row of (rows ?? []) as CartRow[]) {
    const list = grouped.get(row.user_id) ?? [];
    list.push(row);
    grouped.set(row.user_id, list);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">سبدهای خرید کاربران</h1>
        <CartsCleanupButton />
      </div>

      {grouped.size === 0 && (
        <p className="text-gray-500 text-sm text-center py-10">هیچ سبد خرید فعالی یافت نشد.</p>
      )}

      <div className="space-y-5">
        {Array.from(grouped.entries()).map(([userId, items]) => {
          const total = items.reduce((sum, i) => sum + (i.discount_price ?? i.price) * i.quantity, 0);
          return (
            <div key={userId} className="admin-card">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p className="font-bold text-gray-800">{items[0].profile?.full_name ?? "کاربر"}</p>
                  {items[0].profile?.phone && <p className="text-xs text-gray-500" dir="ltr">{items[0].profile.phone}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{total.toLocaleString("fa-IR")} تومان</span>
                  <DeleteUserCartButton userId={userId} />
                </div>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>مشخصات</th>
                    <th>تعداد</th>
                    <th>قیمت واحد</th>
                    <th>افزوده‌شده در</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{[item.selected_color, item.selected_size].filter(Boolean).join(" / ") || "—"}</td>
                      <td>{item.quantity.toLocaleString("fa-IR")}</td>
                      <td>{(item.discount_price ?? item.price).toLocaleString("fa-IR")} تومان</td>
                      <td className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString("fa-IR")}</td>
                      <td><DeleteCartItemButton itemId={item.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}