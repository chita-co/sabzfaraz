import { createClient } from "@/lib/supabase/server";
import BulkPriceUpdateClient from "@/components/admin/BulkPriceUpdateClient";

export default async function BulkPriceUpdatePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  return <BulkPriceUpdateClient categories={categories ?? []} />;
}