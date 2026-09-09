"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Pencil, Check, X } from "lucide-react";
import { sendPartnerMessageAction, getPartnerTicketMessages, editPartnerMessage } from "@/app/partner/support/actions";

interface Message { id: string; sender_role: string; sender_name: string; message: string | null; created_at: string; }

export default function PartnerSupportChat({ ticketId, initialMessages, isClosed }: { ticketId: string; initialMessages: Message[]; isClosed: boolean }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(async () => setMessages(await getPartnerTicketMessages(ticketId) as Message[]), 4000);
    return () => clearInterval(timer);
  }, [ticketId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function handleSend() {
    if (!text.trim()) return;
    await sendPartnerMessageAction(ticketId, text.trim());
    setText("");
    setMessages(await getPartnerTicketMessages(ticketId) as Message[]);
  }

  function startEdit(m: Message) {
    setEditingId(m.id);
    setEditText(m.message ?? "");
  }

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    await editPartnerMessage(id, editText.trim());
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, message: editText.trim() } : m)));
    setEditingId(null);
  }

  return (
    <div className="support-chat">
      <div className="support-chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`support-msg${m.sender_role === "ADMIN" ? " admin" : " user"}`}>
            <div className="support-msg-col">
              <div className="support-msg-bubble">
                <span className="support-msg-sender">{m.sender_name}</span>
                {editingId === m.id ? (
                  <textarea
                    ref={autoResize}
                    className="support-edit-textarea"
                    value={editText}
                    onChange={(e) => { setEditText(e.target.value); autoResize(e.target); }}
                  />
                ) : (
                  m.message && <p>{m.message}</p>
                )}
                <span className="support-msg-time">{new Date(m.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {m.sender_role === "PARTNER" && editingId !== m.id && !isClosed && (
                <div className="support-msg-actions">
                  <button className="support-msg-edit-btn" onClick={() => startEdit(m)} aria-label="ویرایش"><Pencil size={12} /></button>
                </div>
              )}
              {editingId === m.id && (
                <div className="support-edit-actions">
                  <button onClick={() => saveEdit(m.id)} aria-label="تأیید"><Check size={16} /></button>
                  <button onClick={() => setEditingId(null)} aria-label="لغو"><X size={16} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {isClosed ? (
        <div className="support-closed-note">این گفتگو بسته شده است.</div>
      ) : (
        <div className="support-chat-input">
          <textarea
            ref={autoResize}
            placeholder="پیام خود را بنویسید..."
            value={text}
            onChange={(e) => { setText(e.target.value); autoResize(e.target); }}
            rows={1}
          />
          <button onClick={handleSend}><Send size={18} /></button>
        </div>
      )}
    </div>
  );
}