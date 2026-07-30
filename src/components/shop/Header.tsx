import { createClient } from "@/lib/supabase/server";
import HeaderNav from "./HeaderNav";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { full_name: string | null; role: string } | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
    profile = data;
  }

  const [{ data: categories }, { data: settings }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").is("parent_id", null).eq("is_active", true).order("name"),
    supabase.from("site_settings").select("logo_url").eq("id", 1).single(),
  ]);

  return (
    <HeaderNav
      isLoggedIn={!!user}
      userName={profile?.full_name ?? null}
      isAdmin={profile?.role === "ADMIN"}
      categories={categories ?? []}
      logoUrl={settings?.logo_url ?? null}
    />
  );
}