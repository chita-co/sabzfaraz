"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { startAdminTicket } from "@/app/admin/support/actions";

export default function SendSupportMessageButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setError(null);
    const result = await startAdminTicket(userId, subject, message);
    setSending(false);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    setSubject("");
    setMessage("");
    if (result.ticketId) router.push(`/admin/support/${result.ticketId}`);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="admin-btn admin-btn-secondary flex items-center gap-1">
        <MessageCircle size={14} /> ارسال پیام
      </button>
      {open && (
        <div className="admin-modal-overlay" onClick={() => setOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">ارسال پیام پشتیبانی به {userName}</h2>
            <div className="admin-form-group">
              <label>موضوع (اختیاری)</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="مثلاً: پیگیری سفارش" />
            </div>
            <div className="admin-form-group">
              <label>متن پیام</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="پیام خود را بنویسید..." />
            </div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={handleSend} disabled={sending || !message.trim()} className="admin-btn admin-btn-primary">
                {sending ? "در حال ارسال..." : "ارسال"}
              </button>
              <button onClick={() => setOpen(false)} className="admin-btn admin-btn-secondary">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}