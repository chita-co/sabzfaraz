"use client";
import { useEffect, useState } from "react";

export default function NewOrdersBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchCount() {
      try {
        const res = await fetch("/api/admin/new-orders-count");
        const data = await res.json();
        if (active) setCount(data.count ?? 0);
      } catch {
        if (active) setCount(0);
      }
    }
    fetchCount();
    const timer = setInterval(fetchCount, 20000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  if (!count) return null;
  return (
    <span style={{ background: "#dc2626", color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 999, minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px", marginRight: 6 }}>
      {count > 99 ? "99+" : count.toLocaleString("fa-IR")}
    </span>
  );
}