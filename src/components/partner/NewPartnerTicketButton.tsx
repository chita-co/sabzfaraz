"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPartnerTicketAction } from "@/app/partner/support/actions";

export default function NewPartnerTicketButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");

  async function submit() {
    if (!subject.trim()) return;
    const res = await createPartnerTicketAction(subject);
    if (res.success && res.ticketId) router.push(`/partner/support/${res.ticketId}`);
  }

  return open ? (
    <div style={{ display: "flex", gap: 6 }}>
      <input className="partner-input" placeholder="موضوع پیام" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <button onClick={submit} className="partner-btn partner-btn-primary">ارسال</button>
    </div>
  ) : (
    <button onClick={() => setOpen(true)} className="partner-btn partner-btn-primary">+ گفتگوی جدید</button>
  );
}