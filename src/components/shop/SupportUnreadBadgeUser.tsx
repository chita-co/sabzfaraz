"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SupportUnreadBadgeUser() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function fetchCount() {
      try {
        const res = await fetch("/api/support/unread-count");
        const data = await res.json();
        if (active) setCount(data.count ?? 0);
      } catch {
        if (active) setCount(0);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchCount();
        if (timer) clearInterval(timer);
        timer = setInterval(fetchCount, 20000);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user) return; // کاربر مهمان است، نیازی به poll نیست
      fetchCount();
      timer = setInterval(fetchCount, 60000);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    });

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!count) return null;
  return (
    <span className="support-badge-user" style={{ position: "absolute", top: -4, left: -4, background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 17, height: 17, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
      {count > 9 ? "9+" : count.toLocaleString("fa-IR")}
    </span>
  );
}