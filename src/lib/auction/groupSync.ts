import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function syncAuctionGroupsOnWinnerChange(
  admin: ReturnType<typeof createAdminClient>,
  auctionId: string,
  winningGroupId: string | null
) {
  if (winningGroupId) {
    await admin.from("auction_bid_groups").update({ status: "WON" }).eq("id", winningGroupId);
    await admin
      .from("auction_bid_groups")
      .update({ status: "LOST" })
      .eq("auction_id", auctionId)
      .neq("id", winningGroupId)
      .in("status", ["OPEN", "LOCKED", "WON"]);
  } else {
    await admin
      .from("auction_bid_groups")
      .update({ status: "LOST" })
      .eq("auction_id", auctionId)
      .in("status", ["OPEN", "LOCKED", "WON"]);
  }
}

export async function notifyGroupMembersOfWin(admin: ReturnType<typeof createAdminClient>, groupId: string, auctionTitle: string) {
  const { data: group } = await admin.from("auction_bid_groups").select("leader_user_id").eq("id", groupId).single();
  const { data: members } = await admin.from("auction_bid_group_members").select("user_id").eq("group_id", groupId);
  for (const m of members ?? []) {
    if (m.user_id === group?.leader_user_id) continue; // سرگروه از طریق اعلان اصلی برنده‌شدن مطلع می‌شود
    await createNotification(m.user_id, "گروه شما برنده مزایده شد! 🎉", `گروهی که در آن عضو هستید، مزایده «${auctionTitle}» را برد. برای پرداخت سهم خود به صفحه گروه مراجعه کنید.`);
  }
}