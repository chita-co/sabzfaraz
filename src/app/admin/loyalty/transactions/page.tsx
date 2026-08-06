import { createClient } from "@/lib/supabase/server";
import LoyaltyTransactionsTable from "@/components/admin/LoyaltyTransactionsTable";

// تایپ ساده برای ردیف‌های تراکنش
interface TransactionRow {
  profile: { full_name: string | null; phone: string | null } | null;
}

export default async function AdminLoyaltyTransactionsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();

  // استفاده از const به‌جای let
  const query = supabase
    .from("loyalty_transactions")
    .select("*, profile:profiles(full_name, phone)")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: transactions } = await query;

  const filtered = q
    ? ((transactions as TransactionRow[]) ?? []).filter((t) =>
        t.profile?.full_name?.includes(q) || t.profile?.phone?.includes(q)
      )
    : transactions ?? [];

  return (
    <LoyaltyTransactionsTable transactions={filtered} initialQuery={q ?? ""} />
  );
}