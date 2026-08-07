import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import UnboxingVideosTable from "@/components/admin/UnboxingVideosTable";

const tabs = [
  { value: "", label: "همه" }, { value: "PENDING", label: "در انتظار" },
  { value: "PUBLISHED", label: "منتشرشده" }, { value: "REJECTED", label: "رد‌شده" },
];

export default async function AdminUnboxingPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("unboxing_videos").select("*, product:products(name)").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data: videos } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">ویدیوهای آنباکس</h1>
        <Link href="/admin/unboxing/new" className="admin-btn admin-btn-primary flex items-center gap-2"><Plus size={16} /> افزودن ویدیو</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <Link key={t.value} href={t.value ? `/admin/unboxing?status=${t.value}` : "/admin/unboxing"} className={`order-tab${(status ?? "") === t.value ? " active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <UnboxingVideosTable videos={videos ?? []} />
    </div>
  );
}