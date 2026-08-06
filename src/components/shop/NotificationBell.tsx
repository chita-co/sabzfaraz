"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

interface Notif { id: string; title: string; message: string; is_read: boolean; created_at: string; }

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {}
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "POST", body: JSON.stringify({ id }) });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  if (notifications.length === 0 && unreadCount === 0) {
    // هنوز هم دکمه رو نشون بده تا وقتی نوتیف جدید اومد بدون رفرش صفحه دیده بشه
  }

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="site-icon-btn" onClick={() => setOpen((v) => !v)}>
        <Bell size={19} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "۹+" : unreadCount.toLocaleString("fa-IR")}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <p className="notif-dropdown-title">اعلان‌ها</p>
          {notifications.length === 0 ? (
            <p className="notif-empty">اعلانی نداری.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`notif-item${n.is_read ? "" : " unread"}`} onClick={() => markRead(n.id)}>
                <p className="notif-item-title">{n.title}</p>
                <p className="notif-item-message">{n.message}</p>
                <p className="notif-item-date">{new Date(n.created_at).toLocaleDateString("fa-IR")}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}