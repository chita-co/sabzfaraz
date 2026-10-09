import { createClient } from "@/lib/supabase/server";
import { getHeaderData, getAnnouncementSettings } from "@/lib/cache/siteData";
import HeaderNav from "./HeaderNav";
import { cookies } from "next/headers";
import AnnouncementBar from "./AnnouncementBar";

// اثر انگشت کوتاه متن؛ برای «بسته‌شدن تا زمانی که ادمین متن را عوض نکرده»
function textHash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { full_name: string | null; role: string } | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
    profile = data;
  }

  const [{ categories, allCategories, settings }, { data: fullProfile }, announcement] = await Promise.all([
    getHeaderData().catch(() => ({ categories: null, allCategories: null, settings: null })),
    user ? supabase.from("profiles").select("wallet_balance").eq("id", user.id).single() : Promise.resolve({ data: null }),
    getAnnouncementSettings().catch(() => null),
  ]);

  const walletBalance = fullProfile?.wallet_balance ?? 0;

  const categoryTree = (categories ?? []).map((top) => ({
    id: top.id,
    name: top.name,
    slug: top.slug,
    children: (allCategories ?? [])
      .filter((c) => c.parent_id === top.id)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  }));

  // اطلاعیه‌های بالای سایت (باکس‌هایی که کاربر بسته و متنشان عوض نشده، نمایش داده نمی‌شوند)
  const jar = await cookies();
  const announcementItems = announcement?.announcement_enabled
    ? [
        { key: "1", text: announcement.announcement_text_1, bg: "#15803d", color: "#ffffff" },
        { key: "2", text: announcement.announcement_text_2, bg: "#fbbf24", color: "#111827" },
      ]
        .map((i) => ({ ...i, text: (i.text ?? "").trim() }))
        .filter((i) => i.text.length > 0)
        .map((i) => ({ ...i, hash: textHash(i.text) }))
        .filter((i) => jar.get(`ann_${i.key}`)?.value !== i.hash)
    : [];

  return (
    <div style={{ position: "relative", zIndex: 100, isolation: "isolate" }}>
      {announcementItems.length > 0 && <AnnouncementBar items={announcementItems} />}
      <HeaderNav
      isLoggedIn={!!user}
      userName={profile?.full_name ?? null}
      isAdmin={profile?.role === "ADMIN"}
      categories={categories ?? []}
      categoryTree={categoryTree}
      logoUrl={settings?.logo_url ?? null}
      walletBalance={walletBalance}
      auctionEnabled={settings?.auction_header_enabled ?? true}
      auctionLabel={settings?.auction_header_label ?? "جمعه بازار"}
      />
    </div>
  );
}