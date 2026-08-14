import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReverseAuctionForm from "@/components/admin/ReverseAuctionForm";

export default async function EditReverseAuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: auction }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from("reverse_auctions").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("products").select("id, name").order("name"),
  ]);
  if (!auction) notFound();
  return <ReverseAuctionForm mode="edit" auction={auction} categories={categories ?? []} products={products ?? []} />;
}