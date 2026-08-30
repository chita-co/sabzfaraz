"use client";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { triggerImageRegenerationAction } from "@/app/admin/partners/settings/actions";

export default function RegenerateImagesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("همه‌ی تصاویر محصولات همکاران با قالب فعلی بازتولید می‌شوند. این عملیات ممکن است چند دقیقه طول بکشد. ادامه می‌دهید؟")) return;
    startTransition(async () => {
      const res = await triggerImageRegenerationAction();
      if ('error' in res) {
        return setResult("خطا: " + res.error);
      }
      setResult(`${res.successCount} از ${res.total} تصویر با موفقیت بازتولید شد.${res.failCount ? ` (${res.failCount} خطا)` : ""}`);
    });
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button onClick={handleClick} disabled={isPending} className="admin-btn admin-btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <RefreshCw size={14} /> {isPending ? "در حال بازتولید..." : "بازتولید همه‌ی تصاویر با قالب جدید"}
      </button>
      {result && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>{result}</p>}
    </div>
  );
}