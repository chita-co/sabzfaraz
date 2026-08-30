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
    const interval = setInterval(fetchCount, 20000);
    window.addEventListener("admin-orders-changed", fetchCount);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
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