"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBulkOrderStatus(id: string, status: string, adminNote?: string) {
  const supabase = await createClient();
  const payload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (adminNote !== undefined) payload.admin_note = adminNote;
  const { error } = await supabase.from("bulk_order_requests").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${id}`);
  return { success: true };
}