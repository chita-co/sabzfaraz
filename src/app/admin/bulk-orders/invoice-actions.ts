"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveManualInvoice(requestId: string, invoiceHtml: string, invoiceNumber: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bulk_order_requests").update({
    final_invoice_html: invoiceHtml, final_invoice_number: invoiceNumber, updated_at: new Date().toISOString(),
  }).eq("id", requestId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  revalidatePath(`/admin/bulk-orders/${requestId}/invoice-builder`);
  return { success: true };
}