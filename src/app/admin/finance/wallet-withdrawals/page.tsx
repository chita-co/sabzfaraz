import { createClient } from "@/lib/supabase/server";
import WalletWithdrawalManager from "@/components/admin/WalletWithdrawalManager";

export default async function AdminWalletWithdrawalsPage() {
  const supabase = await createClient();
  const [{ data: withdrawals }, { data: bankAccounts }, { data: sumRows }] = await Promise.all([
    supabase.from("wallet_platform_withdrawals").select("*, bank_account:bank_accounts(bank_name, account_holder_name)").order("created_at", { ascending: false }),
    supabase.from("bank_accounts").select("id, bank_name, account_holder_name").eq("is_active", true),
    supabase.from("profiles").select("wallet_balance"),
  ]);

  const totalWallets = (sumRows ?? []).reduce((s, r) => s + (r.wallet_balance ?? 0), 0);
  const totalWithdrawn = (withdrawals ?? []).reduce((s, w) => s + w.amount, 0);

  return (
    <WalletWithdrawalManager
      withdrawals={withdrawals ?? []}
      bankAccounts={bankAccounts ?? []}
      totalWallets={totalWallets}
      totalWithdrawn={totalWithdrawn}
    />
  );
}