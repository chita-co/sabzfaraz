"use client";
import { useEffect, useState } from "react";

export default function SupportUnreadBadgeUser() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchCount() {
      try {
        const res = await fetch("/api/support/unread-count");
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
    <span style={{ position: "absolute", top: -4, left: -4, background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 17, height: 17, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
      {count > 9 ? "9+" : count.toLocaleString("fa-IR")}
    </span>
  );
}