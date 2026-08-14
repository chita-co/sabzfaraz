import { createClient } from "@/lib/supabase/server";
import WalletRequestsManager from "@/components/admin/WalletRequestsManager";

export default async function AdminWalletRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("wallet_topup_requests")
    .select("*, profile:profiles(full_name, phone), bank_account:bank_accounts(bank_name)")
    .order("created_at", { ascending: false });

  const { data: sumRows } = await supabase.from("profiles").select("wallet_balance");
  const totalWallets = (sumRows ?? []).reduce((s, r) => s + (r.wallet_balance ?? 0), 0);

  return <WalletRequestsManager requests={requests ?? []} totalWallets={totalWallets} />;
}