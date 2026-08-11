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

  const [{ data: request }, { data: messages }, { data: banks }] = await Promise.all([
    supabase.from("bulk_order_requests").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("bulk_order_messages").select("*").eq("request_id", id).order("created_at", { ascending: true }),
    supabase.from("bank_accounts").select("*").eq("is_active", true).order("sort_order"),
  ]);
  if (!request) notFound();

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "سفارش‌های جمعی من", href: "/bulk-order" }, { label: request.request_number }]} />
      </div>
      <BulkOrderDetailClient
        requestId={id}
        requestNumber={request.request_number}
        status={request.status}
        storeItems={request.store_items ?? []}
        marketItems={request.market_items ?? []}
        depositAmount={request.deposit_amount}
        depositExpiresAt={request.deposit_expires_at}
        banks={banks ?? []}
        rejectionReason={request.rejection_reason}
        initialMessages={messages ?? []}
      />
    </>
  );
}