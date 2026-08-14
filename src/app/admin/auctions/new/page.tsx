import { createClient } from "@/lib/supabase/server";
import AuctionForm from "@/components/admin/AuctionForm";

export default async function NewAuctionPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("products").select("id, name").order("name"),
  ]);
  return <AuctionForm mode="create" categories={categories ?? []} products={products ?? []} />;
}