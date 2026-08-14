import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { syncAuctionGroupsOnWinnerChange, notifyGroupMembersOfWin } from "@/lib/auction/groupSync";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: expired } = await admin
    .from("auctions").select("*")
    .eq("status", "WINNER_DETERMINED").eq("winner_payment_status", "PENDING")
    .lt("winner_payment_deadline", now);

  for (const auction of expired ?? []) {
    if (auction.winner_user_id) {
      await createNotification(auction.winner_user_id, "مهلت پرداخت به پایان رسید", `مهلت پرداخت نهایی مزایده «${auction.title}» به پایان رسید و فرصت خرید از شما سلب شد.`);
      try {
        await admin.rpc("penalize_auction_no_payment", { p_user_id: auction.winner_user_id });
      } catch (e) {
        console.error("خطا در ثبت جریمه اعتبار کاربر:", e);
      }
    }

    const { data: secondBid } = await admin
      .from("auction_bids").select("*")
      .eq("auction_id", auction.id).eq("is_bot", false)
      .neq("user_id", auction.winner_user_id)
      .order("amount", { ascending: false }).limit(1).maybeSingle();

    if (secondBid && (!auction.reserve_price || secondBid.amount >= auction.reserve_price)) {
      const deadline = new Date(Date.now() + (auction.final_payment_hours ?? 24) * 3600000).toISOString();
      await admin.from("auctions").update({
        winner_user_id: secondBid.user_id, winner_bid_amount: secondBid.amount,
        winner_payment_deadline: deadline, winner_payment_status: "PENDING",
      }).eq("id", auction.id);

      await syncAuctionGroupsOnWinnerChange(admin, auction.id, secondBid.group_id ?? null);
      if (secondBid.group_id) {
        await notifyGroupMembersOfWin(admin, secondBid.group_id, auction.title);
      }

      await createNotification(secondBid.user_id, "🎉 شما برنده مزایده شدید!", `نفر اول مزایده «${auction.title}» مهلت پرداخت را از دست داد و شما به‌عنوان برنده جدید انتخاب شدید. لطفاً ظرف ${auction.final_payment_hours} ساعت پرداخت کنید.`);
    } else {
      await admin.from("auctions").update({ status: "FAILED_NO_WINNER", winner_payment_status: "EXPIRED" }).eq("id", auction.id);
      await syncAuctionGroupsOnWinnerChange(admin, auction.id, null);
    }
  }

  return NextResponse.json({ status: "ok", processed: expired?.length ?? 0 });
}