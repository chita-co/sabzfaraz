import { createClient } from "@/lib/supabase/server";
import BankAccountsManager from "@/components/admin/BankAccountsManager";

export default async function AdminBankAccountsPage() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: settings }] = await Promise.all([
    supabase.from("bank_accounts").select("*").order("sort_order"),
    supabase.from("site_settings").select("bulk_order_enabled, bulk_order_fee_type, bulk_order_fee_value").eq("id", 1).single(),
  ]);

  return (
    <BankAccountsManager
      accounts={accounts ?? []}
      bulkSettings={settings ?? { bulk_order_enabled: true, bulk_order_fee_type: "percent", bulk_order_fee_value: 10 }}
    />
  );
}