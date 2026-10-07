"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveTrackingCode(orderId: string, code: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ shipment_tracking_code: code }).eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}