import { createClient } from "@/lib/supabase/server";
import SalesAnalytics from "@/components/admin/SalesAnalytics";

// نوع دقیق برای آیتم‌های دریافتی از order_items
interface OrderItemRow {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(now.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const [
    { data: dailyOrders },
    { data: yearOrders },
    { data: itemsData },
    { count: totalOrdersCount },
    { count: totalCustomersCount },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("created_at, total_amount")
      .eq("payment_status", "PAID")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("orders")
      .select("created_at, total_amount")
      .eq("payment_status", "PAID")
      .gte("created_at", twelveMonthsAgo.toISOString()),
    supabase
      .from("order_items")
      .select("product_id, product_name, quantity, price, orders!inner(payment_status)")
      .eq("orders.payment_status", "PAID"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("payment_status", "PAID"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(thirtyDaysAgo.getDate() + i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  (dailyOrders ?? []).forEach((o) => {
    const key = o.created_at.slice(0, 10);
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + o.total_amount);
  });
  const dailyData = Array.from(dailyMap.entries()).map(([date, amount]) => ({
    label: new Date(date).toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
    amount,
  }));

  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo);
    d.setMonth(twelveMonthsAgo.getMonth() + i);
    monthlyMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  (yearOrders ?? []).forEach((o) => {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + o.total_amount);
  });
  const monthlyData = Array.from(monthlyMap.entries()).map(([key, amount]) => {
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return { label: d.toLocaleDateString("fa-IR", { month: "long", year: "numeric" }), amount };
  });

  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  (itemsData as OrderItemRow[] ?? []).forEach((item) => {
    const cur = productMap.get(item.product_id) ?? { name: item.product_name, quantity: 0, revenue: 0 };
    cur.quantity += item.quantity;
    cur.revenue += item.price * item.quantity;
    productMap.set(item.product_id, cur);
  });
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const totalRevenue = (yearOrders ?? []).reduce((s, o) => s + o.total_amount, 0);
  const avgOrderValue = totalOrdersCount ? Math.round(totalRevenue / totalOrdersCount) : 0;

  return (
    <SalesAnalytics
      dailyData={dailyData}
      monthlyData={monthlyData}
      topProducts={topProducts}
      stats={{
        totalRevenue,
        totalOrders: totalOrdersCount ?? 0,
        avgOrderValue,
        totalCustomers: totalCustomersCount ?? 0,
      }}
    />
  );
}