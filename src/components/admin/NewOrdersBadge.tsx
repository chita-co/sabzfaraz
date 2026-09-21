"use client";
import { useEffect, useState, useCallback } from "react";

export default function NewOrdersBadge() {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/new-orders-count");
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    const initialFetch = setTimeout(() => fetchCount(), 0);
    let interval: ReturnType<typeof setInterval> | null = setInterval(fetchCount, 20000);
    // تا وقتی تب مرورگر در پس‌زمینه‌ست poll متوقف می‌شه، همین که برگردد فوراً یک‌بار چک می‌شه.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchCount();
        if (interval) clearInterval(interval);
        interval = setInterval(fetchCount, 20000);
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("admin-orders-changed", fetchCount);
    return () => {
      clearTimeout(initialFetch);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("admin-orders-changed", fetchCount);
    };
  }, [fetchCount]);

  if (!count) return null;
  return (
    <span style={{ background: "#dc2626", color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 999, minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px", marginRight: 6 }}>
      {count > 99 ? "99+" : count.toLocaleString("fa-IR")}
    </span>
  );
}