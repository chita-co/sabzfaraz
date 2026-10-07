// src/app/(shop)/profile/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "@/components/shop/ProfileClient";
import GrainientBackground from "@/components/backgrounds/GrainientBackground";
import { getAllBadges, getUserBadgeIds } from "@/lib/blog/badges";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: addresses }, allBadges, earnedBadgeIds] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, national_id, identity_verified").eq("id", user.id).single(),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getAllBadges(),
    getUserBadgeIds(user.id),
  ]);

  return (
    <>
      <GrainientBackground />
      <ProfileClient
        email={user.email ?? ""}
        fullName={profile?.full_name ?? null}
        phone={profile?.phone ?? null}
        nationalId={profile?.national_id ?? null}
        identityVerified={profile?.identity_verified ?? false}
        addresses={addresses ?? []}
        badges={allBadges}
        earnedBadgeIds={Array.from(earnedBadgeIds)}
      />
    </>
  );
}