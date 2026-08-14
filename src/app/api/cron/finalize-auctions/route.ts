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

  const { data: ended } = await admin.from("auctions").select("*").eq("status", "ACTIVE").lte("ends_at", now);

  for (const auction of ended ?? []) {
    const { data: botSettings } = await admin.from("auction_bot_settings").select("end_behavior").eq("id", 1).single();

    const { data: highestBid } = await admin
      .from("auction_bids")
      .select("*")
      .eq("auction_id", auction.id)
      .order("amount", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: participants } = await admin.from("auction_participants").select("user_id").eq("auction_id", auction.id).eq("entry_fee_paid", true);

    if (!highestBid || (auction.reserve_price && highestBid.amount < auction.reserve_price)) {
      await admin.from("auctions").update({ status: "FAILED_NO_WINNER" }).eq("id", auction.id);
      await syncAuctionGroupsOnWinnerChange(admin, auction.id, null);
      for (const p of participants ?? []) {
        if (auction.entry_fee_refundable) await admin.rpc("refund_auction_entry_fee", { p_auction_id: auction.id, p_user_id: p.user_id, p_reason: "بازگشت هزینه شرکت — مزایده بدون برنده" });
        await createNotification(p.user_id, "پایان مزایده", `مزایده «${auction.title}» بدون برنده به پایان رسید.`);
      }
      continue;
    }

    let winnerBid = highestBid;
    if (highestBid.is_bot) {
      if (botSettings?.end_behavior === "CANCEL") {
        await admin.from("auctions").update({ status: "CANCELLED" }).eq("id", auction.id);
        await syncAuctionGroupsOnWinnerChange(admin, auction.id, null);
        for (const p of participants ?? []) {
          await admin.rpc("refund_auction_entry_fee", { p_auction_id: auction.id, p_user_id: p.user_id, p_reason: "بازگشت هزینه شرکت — لغو خودکار مزایده" });
          await createNotification(p.user_id, "مزایده لغو شد", `مزایده «${auction.title}» به دلیل نبود پیشنهاد واقعی کافی لغو شد.`);
        }
        continue;
      }
      if (botSettings?.end_behavior === "SECOND_REAL_BIDDER") {
        const { data: secondReal } = await admin
          .from("auction_bids").select("*").eq("auction_id", auction.id).eq("is_bot", false)
          .order("amount", { ascending: false }).limit(1).maybeSingle();
        if (!secondReal) {
          await admin.from("auctions").update({ status: "FAILED_NO_WINNER" }).eq("id", auction.id);
          await syncAuctionGroupsOnWinnerChange(admin, auction.id, null);
          continue;
        }
        winnerBid = secondReal;
      }
      // SHOWCASE_WINNER: از همان highestBid ربات به‌عنوان برنده نمایشی استفاده می‌شود
    }

    const deadline = new Date(Date.now() + (auction.final_payment_hours ?? 24) * 3600000).toISOString();
    await admin.from("auctions").update({
      status: "WINNER_DETERMINED",
      winner_user_id: winnerBid.user_id,
      winner_bid_amount: winnerBid.amount,
      winner_payment_deadline: deadline,
      winner_payment_status: winnerBid.is_bot ? null : "PENDING",
    }).eq("id", auction.id);

    await syncAuctionGroupsOnWinnerChange(admin, auction.id, winnerBid.group_id ?? null);
    if (winnerBid.group_id) {
      await notifyGroupMembersOfWin(admin, winnerBid.group_id, auction.title);
    }

    if (!winnerBid.is_bot && winnerBid.user_id) {
      const groupNote = winnerBid.group_id ? " (این پیشنهاد به‌صورت گروهی ثبت شده بود — همه اعضای گروه باید سهم خود را بپردازند)" : "";
      await createNotification(winnerBid.user_id, "🎉 شما برنده مزایده شدید!", `شما در مزایده «${auction.title}» با پیشنهاد ${winnerBid.amount.toLocaleString("fa-IR")} تومان برنده شدید. لطفاً ظرف ${auction.final_payment_hours} ساعت آینده مبلغ نهایی را پرداخت کنید.${groupNote}`);
    }
    for (const p of participants ?? []) {
      if (p.user_id !== winnerBid.user_id) {
        await createNotification(p.user_id, "پایان مزایده", `مزایده «${auction.title}» به پایان رسید و نفر برنده مشخص شد. متأسفانه شما برنده نشدید.`);
        if (auction.entry_fee_refundable) {
          await admin.rpc("refund_auction_entry_fee", { p_auction_id: auction.id, p_user_id: p.user_id, p_reason: "بازگشت هزینه شرکت — عدم برنده شدن" });
        }
      }
    }
  }

  return NextResponse.json({ status: "ok", processed: ended?.length ?? 0 });
}