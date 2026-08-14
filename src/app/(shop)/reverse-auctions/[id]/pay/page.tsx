import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReverseAuctionPaymentClient from "@/components/shop/ReverseAuctionPaymentClient";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GrainientBackground from "@/components/backgrounds/GrainientBackground";

export default async function ReverseAuctionPayPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ submitted?: string; payment?: string }> }) {
  const { id } = await params;
  const { submitted, payment } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/reverse-auctions/${id}/pay`);

  const { data: auction } = await supabase.from("reverse_auctions").select("*").eq("id", id).single();
  if (!auction) notFound();

  if (auction.winner_user_id !== user.id) {
    return (
      <>
        <GrainientBackground />
        <div className="mx-auto max-w-xl px-4 py-16 text-center relative z-10">
          <p className="text-white">شما به‌عنوان خریدار این کالا ثبت نشده‌اید.</p>
        </div>
      </>
    );
  }

  const [{ data: addresses }, { data: bankAccounts }] = await Promise.all([
    supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }),
    supabase.from("bank_accounts").select("*").eq("is_active", true).order("sort_order"),
  ]);

  const alreadySubmitted = auction.payment_status !== "PENDING" || submitted === "1";

  return (
    <>
      <GrainientBackground />
      <div className="mx-auto max-w-2xl px-4 py-10 relative z-10">
        <Breadcrumb theme="light" items={[{ label: "حراج معکوس", href: "/reverse-auctions" }, { label: auction.title, href: `/reverse-auctions/${id}` }, { label: "تکمیل خرید" }]} />
        <ReverseAuctionPaymentClient
          auction={auction}
          addresses={addresses ?? []}
          bankAccounts={bankAccounts ?? []}
          alreadySubmitted={alreadySubmitted}
          paymentResult={payment ?? null}
        />
      </div>
    </>
  );
}