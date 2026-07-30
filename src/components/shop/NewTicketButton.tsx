"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createTicket } from "@/app/(shop)/support/actions";

export default function NewTicketButton() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    await createTicket(subject);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="support-new-btn">
        <Plus size={15} /> گفتگوی جدید
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
  type="text"
  placeholder="موضوع (اختیاری)"
  value={subject}
  onChange={(e) => setSubject(e.target.value)}
  className="support-subject-input text-white placeholder-white/80"
/>
      <button onClick={handleCreate} disabled={loading} className="support-new-btn">
        {loading ? "..." : "شروع"}
      </button>
    </div>
  );
}