"use client";

import { useState, useTransition } from "react";
import { deleteGalleryVideo } from "@/app/admin/gallery/actions";

interface GalleryVideo {
  id: string;
  platform: "instagram" | "youtube" | "aparat";
  video_url: string;
  caption: string | null;
}

const PLATFORM_LABEL: Record<string, string> = { instagram: "اینستاگرام", youtube: "یوتیوب", aparat: "آپارات" };

export default function GalleryVideosTable({ videos }: { videos: GalleryVideo[] }) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const grouped = (["instagram", "youtube", "aparat"] as const).map((p) => ({
    platform: p,
    items: videos.filter((v) => v.platform === p),
  }));

  function handleDelete(id: string) {
    if (!confirm("این ویدیو از گالری حذف شود؟")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteGalleryVideo(id);
      setDeletingId(null);
    });
  }

  return (
    <div className="admin-card">
      <h2 className="text-lg font-bold text-gray-900 mb-4">ویدیوهای گالری</h2>
      {grouped.map((g) => (
        <div key={g.platform} className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">{PLATFORM_LABEL[g.platform]} ({g.items.length})</h3>
          {g.items.length === 0 ? (
            <p className="text-xs text-gray-400">هنوز ویدیویی اضافه نشده.</p>
          ) : (
            <table className="admin-table w-full text-sm">
              <thead><tr><th>لینک</th><th>کپشن</th><th></th></tr></thead>
              <tbody>
                {g.items.map((v) => (
                  <tr key={v.id}>
                    <td dir="ltr" className="truncate max-w-xs"><a href={v.video_url} target="_blank" rel="noreferrer">{v.video_url}</a></td>
                    <td>{v.caption ?? "—"}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn-danger"
                        disabled={isPending && deletingId === v.id}
                        onClick={() => handleDelete(v.id)}
                      >
                        {isPending && deletingId === v.id ? "..." : "حذف"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}