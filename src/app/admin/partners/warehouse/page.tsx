import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface WarehouseProduct {
  id: string;
  name: string;
  stock: number;
  partner_stock_unlimited: boolean;
  price: number;
  partner_cost_price: number | null;
  partner: { business_name: string; partner_code: string | null }[] | null;
}

export default async function AdminPartnerWarehousePage({
  searchParams,
}: { searchParams: Promise<{ partnerId?: string }> }) {
  const { partnerId } = await searchParams;
  const admin = createAdminClient();

  const { data: partners } = await admin.from("partners").select("id, business_name, partner_code").order("business_name");

  let query = admin
    .from("products")
    .select("id, name, stock, partner_stock_unlimited, price, partner_cost_price, partner:partners(business_name, partner_code)")
    .not("partner_id", "is", null)
    .eq("partner_approval_status", "APPROVED");
  if (partnerId) query = query.eq("partner_id", partnerId);
  const { data: products } = await query.order("stock", { ascending: true });

  const { data: soldStats } = await admin.from("order_items").select("product_id, quantity").not("partner_id", "is", null);
  const soldMap = new Map<string, number>();
  (soldStats ?? []).forEach((s) => soldMap.set(s.product_id, (soldMap.get(s.product_id) ?? 0) + s.quantity));

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>انبار و موجودی همکاران</h1>
      <form method="GET" style={{ marginBottom: 14 }}>
        <select name="partnerId" defaultValue={partnerId ?? ""} className="admin-input">
          <option value="">همه همکاران</option>
          {(partners ?? []).map((p) => <option key={p.id} value={p.id}>{p.business_name}</option>)}
        </select>
      </form>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>همکار</th><th>محصول</th><th>موجودی فعلی</th><th>تعداد فروخته‌شده</th><th>قیمت فروش</th><th>دریافتی همکار</th></tr></thead>
          <tbody>
            {(products as unknown as WarehouseProduct[]).map((p) => {
  const partnerName = p.partner?.[0]?.business_name;
  return (
    <tr key={p.id} style={{ background: !p.partner_stock_unlimited && p.stock <= 3 ? "#fef2f2" : undefined }}>
      <td>{partnerName}</td>
      <td>{p.name}</td>
      <td>
        {p.partner_stock_unlimited ? "نامحدود" : p.stock.toLocaleString("fa-IR")}
        {!p.partner_stock_unlimited && p.stock <= 3 && <span style={{ color: "#dc2626", fontSize: 11, marginRight: 6 }}>⚠️ موجودی کم</span>}
      </td>
      <td>{(soldMap.get(p.id) ?? 0).toLocaleString("fa-IR")}</td>
      <td>{p.price.toLocaleString("fa-IR")}</td>
      <td>{(p.partner_cost_price ?? 0).toLocaleString("fa-IR")}</td>
    </tr>
  );
})}
          </tbody>
        </table>
        {(!products || products.length === 0) && <p className="text-gray-500 text-sm text-center py-6">محصولی یافت نشد.</p>}
      </div>
    </div>
  );
}