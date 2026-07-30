import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CategoryNavBar() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .is("parent_id", null)
    .eq("is_active", true)
    .order("name");

  if (!categories || categories.length === 0) return null;

  return (
    <div className="category-navbar">
      <div className="category-navbar-inner">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="category-navbar-link">
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}