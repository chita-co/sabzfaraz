import { createClient } from "@/lib/supabase/server";
import ReverseAuctionForm from "@/components/admin/ReverseAuctionForm";

export default async function NewReverseAuctionPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("products").select("id, name").order("name"),
  ]);
  return <ReverseAuctionForm mode="create" categories={categories ?? []} products={products ?? []} />;
}