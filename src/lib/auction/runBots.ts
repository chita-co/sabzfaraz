import { createAdminClient } from "@/lib/supabase/admin";

export async function runAuctionBotsOnce() {
  const admin = createAdminClient();
  const { data: botSettings } = await admin.from("auction_bot_settings").select("*").eq("id", 1).single();
  if (!botSettings?.enabled_global) {
    return { status: "bots-disabled", bidsPlaced: 0, details: [] as string[] };
  }

  const { data: auctions } = await admin.from("auctions").select("*").eq("status", "ACTIVE");
  let bidsPlaced = 0;
  const details: string[] = [];

  if (!auctions || auctions.length === 0) {
    return { status: "ok", bidsPlaced: 0, details: ["هیچ مزایده‌ی فعالی (وضعیت ACTIVE) در سایت وجود ندارد."] };
  }

  for (const auction of auctions) {
    if (!auction.bots_enabled) {
      details.push(`«${auction.title}»: ربات‌ها برای این مزایده در فرم ساخت/ویرایش فعال نشده‌اند.`);
      continue;
    }

    const { data: lastBid } = await admin
      .from("auction_bids")
      .select("amount, created_at, is_bot")
      .eq("auction_id", auction.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (botSettings.stop_after_real_bid && lastBid && !lastBid.is_bot) {
      details.push(`«${auction.title}»: کاربر واقعی قبلاً پیشنهاد داده — طبق تنظیمات، ربات‌ها بعد از اولین پیشنهاد واقعی متوقف می‌شوند (این رفتار عمدی است).`);
      continue;
    }

    const { count: botBidCount } = await admin.from("auction_bids").select("*", { count: "exact", head: true }).eq("auction_id", auction.id).eq("is_bot", true);
    if ((botBidCount ?? 0) >= botSettings.bots_per_auction * 6) {
      details.push(`«${auction.title}»: سقف تعداد پیشنهاد ربات‌ها برای این مزایده پر شده است.`);
      continue;
    }

    const minutesSinceLastBid = lastBid ? (Date.now() - new Date(lastBid.created_at).getTime()) / 60000 : 999;
    const randomInterval = botSettings.min_interval_minutes + Math.random() * (botSettings.max_interval_minutes - botSettings.min_interval_minutes);
    if (minutesSinceLastBid < randomInterval) {
      const remain = Math.ceil(randomInterval - minutesSinceLastBid);
      details.push(`«${auction.title}»: هنوز به فاصله‌ی زمانی تنظیم‌شده نرسیده (حدود ${remain} دقیقه‌ی دیگر).`);
      continue;
    }

    const nextAmount = (lastBid?.amount ?? auction.base_price) + auction.min_increment + Math.round(Math.random() * 2 * auction.min_increment);
    if (auction.max_price && nextAmount > auction.max_price) {
      details.push(`«${auction.title}»: مبلغ بعدی از سقف قیمت مجاز بیشتر می‌شود.`);
      continue;
    }

    const botName = botSettings.bot_names[Math.floor(Math.random() * botSettings.bot_names.length)] ?? "کاربر مزایده";

    const { data: result, error } = await admin.rpc("place_auction_bid", {
      p_auction_id: auction.id,
      p_user_id: null,
      p_amount: lastBid ? nextAmount : Math.max(auction.base_price, nextAmount),
      p_is_bot: true,
      p_bot_name: botName,
      p_ip_hash: null,
    });

    if (error) {
      details.push(`«${auction.title}»: خطا در ثبت پیشنهاد ربات — ${error.message}`);
      continue;
    }

    if ((result as { success?: boolean })?.success) {
      bidsPlaced++;
      details.push(`«${auction.title}»: ربات «${botName}» پیشنهاد ${nextAmount.toLocaleString("fa-IR")} تومانی ثبت کرد.`);
    } else {
      details.push(`«${auction.title}»: ${(result as { error?: string })?.error ?? "ثبت پیشنهاد ناموفق بود."}`);
    }
  }

  return { status: "ok", bidsPlaced, details };
}