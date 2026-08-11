import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BulkOrderAdminDetail from "@/components/admin/BulkOrderAdminDetail";

export default async function AdminBulkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: request }, { data: bankAccounts }] = await Promise.all([
    supabase.from("bulk_order_requests").select("*, profile:profiles(full_name, phone)").eq("id", id).single(),
    supabase.from("bank_accounts").select("id, bank_name").eq("is_active", true).order("sort_order"),
  ]);
  if (!request) notFound();

  return <BulkOrderAdminDetail request={request} bankAccounts={bankAccounts ?? []} />;
}