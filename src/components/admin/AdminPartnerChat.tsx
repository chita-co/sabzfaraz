// src/components/admin/AdminPartnerChat.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Lock } from "lucide-react";
import { sendAdminPartnerMessageAction, getAdminPartnerTicketMessages, closePartnerTicketAction } from "@/app/admin/partners/support/actions";

interface Message { id: string; sender_role: string; sender_name: string; message: string | null; created_at: string; }

export default function AdminPartnerChat({ ticketId, initialMessages, isClosed }: { ticketId: string; initialMessages: Message[]; isClosed: boolean }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [closed, setClosed] = useState(isClosed);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(async () => setMessages(await getAdminPartnerTicketMessages(ticketId) as Message[]), 4000);
    return () => clearInterval(timer);
  }, [ticketId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function handleSend() {
    if (!text.trim()) return;
    await sendAdminPartnerMessageAction(ticketId, text.trim());
    setText("");
    setMessages(await getAdminPartnerTicketMessages(ticketId) as Message[]);
  }

  return (
    <div>
      {!closed && (
        <button onClick={async () => { await closePartnerTicketAction(ticketId); setClosed(true); }} className="admin-btn admin-btn-secondary flex items-center gap-1" style={{ marginBottom: 10 }}>
          <Lock size={14} /> بستن گفتگو
        </button>
      )}
      <div className="support-chat">
        <div className="support-chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`support-msg${m.sender_role === "ADMIN" ? " admin" : " user"}`}>
              <div className="support-msg-bubble">
                <span className="support-msg-sender">{m.sender_name}</span>
                {m.message && <p>{m.message}</p>}
                <span className="support-msg-time">{new Date(m.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {closed ? <div className="support-closed-note">این گفتگو بسته شده است.</div> : (
          <div className="support-chat-input">
            <input type="text" placeholder="پاسخ خود را بنویسید..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} />
            <button onClick={handleSend}><Send size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}