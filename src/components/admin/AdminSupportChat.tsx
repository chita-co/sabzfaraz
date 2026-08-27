"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Image as ImageIcon, Lock, Trash2 } from "lucide-react";
import { sendAdminMessage, closeTicket, deleteTicket, getAdminTicketMessages } from "@/app/admin/support/actions";
import { markTicketSeenByAdminAction } from "@/app/admin/support/actions";

interface Message {
  id: string; sender_role: string; sender_name: string; message: string | null; image_url: string | null; created_at: string;
}

export default function AdminSupportChat({
  ticketId, initialMessages, isClosed,
}: { ticketId: string; initialMessages: Message[]; isClosed: boolean }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [closed, setClosed] = useState(isClosed);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(async () => {
      const fresh = await getAdminTicketMessages(ticketId);
      setMessages(fresh as Message[]);
    }, 4000);
    return () => clearInterval(timer);
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    markTicketSeenByAdminAction(ticketId).catch(() => {});
  }, [messages.length, ticketId]);

  async function handleSend(imageUrl: string | null = null) {
    if (!text.trim() && !imageUrl) return;
    setSending(true);
    const result = await sendAdminMessage(ticketId, text.trim(), imageUrl);
    setSending(false);
    if (!result?.error) {
      setText("");
      const fresh = await getAdminTicketMessages(ticketId);
      setMessages(fresh as Message[]);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) await handleSend(data.url);
      else alert(data.error || "خطا در آپلود");
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleClose() {
    if (!confirm("آیا از بستن این گفتگو مطمئن هستید؟")) return;
    await closeTicket(ticketId);
    setClosed(true);
  }

  async function handleDelete() {
    if (!confirm("آیا از حذف کامل این گفتگو مطمئن هستید؟ این عملیات غیرقابل بازگشت است.")) return;
    await deleteTicket(ticketId);
    router.push("/admin/support");
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {!closed && (
          <button onClick={handleClose} className="admin-btn admin-btn-secondary flex items-center gap-1">
            <Lock size={14} /> بستن گفتگو
          </button>
        )}
        <button onClick={handleDelete} className="admin-btn admin-btn-danger flex items-center gap-1">
          <Trash2 size={14} /> حذف کامل گفتگو
        </button>
      </div>

      <div className="support-chat">
        <div className="support-chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`support-msg${m.sender_role === "ADMIN" ? " admin" : " user"}`}>
              <div className="support-msg-bubble">
                <span className="support-msg-sender">{m.sender_name}</span>
                {m.message && <p>{m.message}</p>}
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image_url} alt="" onClick={() => window.open(m.image_url!, "_blank")} />
                )}
                <span className="support-msg-time">
                  {new Date(m.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {closed ? (
          <div className="support-closed-note">این گفتگو بسته شده است.</div>
        ) : (
          <div className="support-chat-input">
            <label className="support-image-btn">
              {uploading ? "..." : <ImageIcon size={18} />}
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
            </label>
            <input
              type="text"
              placeholder="پاسخ خود را بنویسید..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            />
            <button onClick={() => handleSend()} disabled={sending}><Send size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}