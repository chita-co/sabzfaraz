"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Pencil, Check, X } from "lucide-react";
import { sendUserMessage, editUserMessage, getTicketMessages } from "@/app/(shop)/support/actions";

interface Message {
  id: string;
  sender_role: string;
  sender_name: string;
  message: string | null;
  image_url: string | null;
  created_at: string;
}

export default function SupportChatClient({
  ticketId,
  initialMessages,
  isClosed,
}: {
  ticketId: string;
  initialMessages: Message[];
  isClosed: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(async () => {
      const fresh = await getTicketMessages(ticketId);
      setMessages(fresh as Message[]);
    }, 4000);
    return () => clearInterval(timer);
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(imageUrl: string | null = null) {
    if (!text.trim() && !imageUrl) return;
    setSending(true);
    const result = await sendUserMessage(ticketId, text.trim(), imageUrl);
    setSending(false);
    if (!result?.error) {
      setText("");
      const fresh = await getTicketMessages(ticketId);
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
      const res = await fetch("/api/support/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) await handleSend(data.url);
      else alert(data.error || "خطا در آپلود تصویر");
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setUploading(false);
    e.target.value = "";
  }

  function startEdit(m: Message) {
    setEditingId(m.id);
    setEditText(m.message ?? "");
  }

  async function saveEdit(id: string) {
    await editUserMessage(id, editText);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, message: editText } : m)));
    setEditingId(null);
  }

  return (
    <div className="support-chat">
      <div className="support-chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`support-msg${m.sender_role === "ADMIN" ? " admin" : " user"}`}>
            <div className="support-msg-bubble">
              <span className="support-msg-sender">
                {m.sender_role === "ADMIN" ? `پشتیبانی — ${m.sender_name}` : m.sender_name}
              </span>
              {editingId === m.id ? (
                <div className="support-edit-row">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                  <button onClick={() => saveEdit(m.id)}><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)}><X size={14} /></button>
                </div>
              ) : (
                <>
                  {m.message && <p>{m.message}</p>}
                  {m.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image_url} alt="" onClick={() => window.open(m.image_url!, "_blank")} />
                  )}
                </>
              )}
              <span className="support-msg-time">
                {new Date(m.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {m.sender_role === "USER" && editingId !== m.id && !isClosed && (
                <button className="support-msg-edit-btn" onClick={() => startEdit(m)}>
                  <Pencil size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {isClosed ? (
        <div className="support-closed-note">این گفتگو توسط پشتیبانی بسته شده است.</div>
      ) : (
        <div className="support-chat-input">
          <label className="support-image-btn">
            {uploading ? "..." : <ImageIcon size={18} />}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
          </label>
          <textarea
            placeholder="پیام خود را بنویسید..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
          />
          <button onClick={() => handleSend()} disabled={sending}>
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
}