import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/sep";
import { creditWallet } from "@/lib/wallet/creditWallet";

export async function POST(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const requestId = searchParams.get("requestId");
  const formData = await request.formData();
  const refNum = formData.get("RefNum") as string | null;
  const state = formData.get("State") as string | null;
  if (!requestId || !refNum) return NextResponse.redirect(`${origin}/profile/wallet?topup=invalid`);

  const admin = createAdminClient();
  const { data: reqRow } = await admin.from("wallet_topup_requests").select("*").eq("id", requestId).single();
  if (!reqRow) return NextResponse.redirect(`${origin}/profile/wallet?topup=notfound`);

  if (state !== "OK" || reqRow.status !== "PENDING") {
    await admin.from("wallet_topup_requests").update({ status: "REJECTED", admin_note: "پرداخت ناموفق" }).eq("id", requestId);
    return NextResponse.redirect(`${origin}/profile/wallet?topup=failed`);
  }

  try {
   const result = await verifyPayment({ amount: reqRow.amount, refNum });
    if (result.ok) {
      await creditWallet(reqRow.user_id, reqRow.amount, "شارژ آنلاین کیف پول");
      await admin.from("wallet_topup_requests").update({ status: "APPROVED", reviewed_at: new Date().toISOString(), method: "ONLINE", sep_ref_num: refNum }).eq("id", requestId);
      return NextResponse.redirect(`${origin}/profile/wallet?topup=success`);
    }
    await admin.from("wallet_topup_requests").update({ status: "REJECTED", admin_note: "تأیید پرداخت ناموفق" }).eq("id", requestId);
    return NextResponse.redirect(`${origin}/profile/wallet?topup=failed`);
  } catch {
    return NextResponse.redirect(`${origin}/profile/wallet?topup=error`);
  }
}