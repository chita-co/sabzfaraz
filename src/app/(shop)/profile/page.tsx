// src/app/(shop)/profile/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "@/components/shop/ProfileClient";
import GrainientBackground from "@/components/backgrounds/GrainientBackground";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
  <>
    <GrainientBackground />
    <ProfileClient
      email={user.email ?? ""}
      fullName={profile?.full_name ?? null}
      phone={profile?.phone ?? null}
      addresses={addresses ?? []}
    />
  </>  // 👈 حتما اضافه کن
);
}