import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuctionForm from "@/components/admin/AuctionForm";

export default async function EditAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: auction }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from("auctions").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("products").select("id, name").order("name"),
  ]);
  if (!auction) notFound();
  return <AuctionForm mode="edit" auction={auction} categories={categories ?? []} products={products ?? []} />;
}