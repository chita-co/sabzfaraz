import { createClient } from "@/lib/supabase/server";
import UnboxingVideoForm from "@/components/admin/UnboxingVideoForm";

export default async function NewUnboxingVideoPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("id, name").order("name");
  return <UnboxingVideoForm products={products ?? []} />;
}