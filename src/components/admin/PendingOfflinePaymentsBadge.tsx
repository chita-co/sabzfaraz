"use client";
import { useEffect, useState } from "react";

export default function PendingOfflinePaymentsBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchCount() {
      try {
        const res = await fetch("/api/admin/pending-offline-payments-count");
        const data = await res.json();
        if (active) setCount(data.count ?? 0);
      } catch {
        if (active) setCount(0);
      }
    }
    fetchCount();
    let timer: ReturnType<typeof setInterval> | null = setInterval(fetchCount, 30000);
    // تا وقتی تب مرورگر در پس‌زمینه‌ست poll متوقف می‌شه، همین که برگردد فوراً یک‌بار چک می‌شه.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchCount();
        if (timer) clearInterval(timer);
        timer = setInterval(fetchCount, 30000);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!count) return null;
  return (
    <span style={{ background: "#dc2626", color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 999, minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px", marginRight: 6 }}>
      {count > 99 ? "99+" : count.toLocaleString("fa-IR")}
    </span>
  );
}