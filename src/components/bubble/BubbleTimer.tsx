"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBubbleRemaining } from "@/lib/bubble/format";

export default function BubbleTimer({ endsAt }: { endsAt?: string | null }) {
  const router = useRouter();
  const end = endsAt ? new Date(endsAt).getTime() : 0;
  const [now, setNow] = useState<number | null>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    if (!end) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [end]);

  // وقتی تایمر تمام شد، صفحه یک‌بار تازه می‌شود تا قیمت اصلی نمایش داده شود
  useEffect(() => {
    if (!end || now === null || end > now || refreshed.current) return;
    refreshed.current = true;
    router.refresh();
  }, [end, now, router]);

  if (!end || now === null || end <= now) return null;

  return (
    <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-linear-to-l from-cyan-500/15 to-pink-500/15 px-3 py-1.5 text-sm font-bold text-cyan-600 ring-1 ring-cyan-400/40">
      ⚡ جز حباب ارزانی ·{" "}
      <span dir="ltr" className="font-mono">
        {formatBubbleRemaining(end - now)}
      </span>
    </div>
  );
}