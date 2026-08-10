import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BulkOrderDetailClient from "@/components/shop/BulkOrderDetailClient";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export default async function BulkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: request }, { data: messages }] = await Promise.all([
    supabase.from("bulk_order_requests").select("*, bank_account:bank_accounts(*)").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("bulk_order_messages").select("*").eq("request_id", id).order("created_at", { ascending: true }),
  ]);
  if (!request) notFound();

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "سفارش‌های جمعی من", href: "/profile/bulk-orders" }, { label: request.request_number }]} />
      </div>
      <BulkOrderDetailClient
        requestId={id}
        requestNumber={request.request_number}
        status={request.status}
        storeItems={request.store_items ?? []}
        marketItems={request.market_items ?? []}
        depositAmount={request.deposit_amount}
        bankAccount={request.bank_account}
        rejectionReason={request.rejection_reason}
        receiptImageUrl={request.receipt_image_url}
        initialMessages={messages ?? []}
      />
    </>
  );
}