import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BulkOrderDetail from "@/components/admin/BulkOrderDetail";

export default async function AdminBulkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("bulk_order_requests")
    .select("*, profile:profiles(full_name, phone), bank_account:bank_accounts(*)")
    .eq("id", id).single();
  if (!request) notFound();

  return <BulkOrderDetail request={request} />;
}