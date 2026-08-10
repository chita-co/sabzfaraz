"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReceipt(requestId: string, receiptUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const { error } = await supabase
    .from("bulk_order_requests")
    .update({ receipt_image_url: receiptUrl, status: "AWAITING_PAYMENT_CONFIRMATION", updated_at: new Date().toISOString() })
    .eq("id", requestId).eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/bulk-order/${requestId}`);
  return { success: true };
}