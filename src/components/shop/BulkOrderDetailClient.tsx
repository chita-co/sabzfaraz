"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Upload, Loader2 } from "lucide-react";
import { sendUserBulkMessage, getBulkMessages } from "@/app/bulk-order/message-actions";
import { submitReceipt } from "@/app/bulk-order/receipt-actions";
import BankAccountDisplay, { type BankAccountInfo } from "./BankAccountDisplay";

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: "در حال بررسی", SUPPLY_POSSIBLE: "تأیید تأمین — منتظر پرداخت بیعانه",
  AWAITING_PAYMENT_CONFIRMATION: "پرداخت در انتظار تأیید", PREPARING: "پرداخت تأیید شد — در حال تهیه",
  COMPLETED: "تکمیل‌شده / ارسال‌شده", NOT_POSSIBLE: "غیرقابل تأمین",
};

interface StoreItem { productName: string; quantity: number; unitPrice: number; }
interface MarketItem { name: string; quantity: number; minPrice: number | null; maxPrice: number | null; }
interface Message { id: string; sender_role: string; sender_name: string; message: string | null; created_at: string; }

export default function BulkOrderDetailClient({
  requestId, requestNumber, status, storeItems, marketItems,
  depositAmount, bankAccount, rejectionReason, receiptImageUrl, initialMessages,
}: {
  requestId: string; requestNumber: string; status: string;
  storeItems: StoreItem[]; marketItems: MarketItem[];
  depositAmount: number | null; bankAccount: BankAccountInfo | null;
  rejectionReason: string | null; receiptImageUrl: string | null;
  initialMessages: Message[];
}) {
  const [view, setView] = useState<"details" | "messages">("details");
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localReceiptUrl, setLocalReceiptUrl] = useState(receiptImageUrl);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await getBulkMessages(requestId);
      setMessages(fresh as Message[]);
    }, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    await sendUserBulkMessage(requestId, text.trim());
    setText("");
    const fresh = await getBulkMessages(requestId);
    setMessages(fresh as Message[]);
    setSending(false);
  }

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/bulk-order/upload-receipt", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        const result = await submitReceipt(requestId, data.url);
        if (!result?.error) { setLocalReceiptUrl(data.url); window.location.reload(); }
      } else alert(data.error || "خطا در آپلود رسید");
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setUploading(false);
  }

  const total = storeItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-white mb-1">سفارش جمعی {requestNumber}</h1>
      <p className="text-amber-400 text-sm mb-6">وضعیت: {statusLabels[status]}</p>

      {status === "SUPPLY_POSSIBLE" && (
        <div className="bulk-status-banner success">
          امکان تأمین کالاهای درخواستی شما فراهم شده است. لطفاً بیعانه را پرداخت نمایید.
        </div>
      )}
      {status === "NOT_POSSIBLE" && rejectionReason && (
        <div className="bulk-status-banner error">
          متأسفانه امکان تأمین این درخواست وجود ندارد. دلیل: {rejectionReason}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setView("details")} className={`order-tab${view === "details" ? " active" : ""}`}>جزئیات</button>
        <button onClick={() => setView("messages")} className={`order-tab${view === "messages" ? " active" : ""}`}>پیام‌ها</button>
      </div>

      {view === "details" ? (
        <>
          {storeItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-800 mb-3">کالاهای موجود در سایت</h2>
              <table className="admin-table">
                <thead><tr><th>نام</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
                <tbody>
                  {storeItems.map((it, i) => (
                    <tr key={i}><td>{it.productName}</td><td>{it.quantity.toLocaleString("fa-IR")}</td><td>{it.unitPrice.toLocaleString("fa-IR")}</td><td>{(it.quantity * it.unitPrice).toLocaleString("fa-IR")}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm font-bold text-gray-800 mt-3">جمع تقریبی: {total.toLocaleString("fa-IR")} تومان</p>
            </div>
          )}

          {marketItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-800 mb-3">کالاهای درخواستی از بازار</h2>
              <table className="admin-table">
                <thead><tr><th>نام</th><th>تعداد</th><th>بازه قیمت</th></tr></thead>
                <tbody>
                  {marketItems.map((it, i) => (
                    <tr key={i}>
                      <td>{it.name}</td><td>{it.quantity.toLocaleString("fa-IR")}</td>
                      <td>{it.minPrice || it.maxPrice ? `${(it.minPrice ?? 0).toLocaleString("fa-IR")} تا ${(it.maxPrice ?? 0).toLocaleString("fa-IR")} تومان` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(status === "SUPPLY_POSSIBLE" || status === "AWAITING_PAYMENT_CONFIRMATION" || status === "PREPARING" || status === "COMPLETED") && depositAmount && bankAccount && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-800 mb-3">پرداخت بیعانه</h2>
              <p className="text-sm text-gray-700 mb-3">مبلغ بیعانه: <b>{depositAmount.toLocaleString("fa-IR")} تومان</b></p>
              <BankAccountDisplay account={bankAccount} mode={bankAccount.card_number ? "card" : "sheba"} />
              <p className="text-xs text-gray-500 mt-3">لطفاً مبلغ فوق را از طریق کارت به کارت یا واریز به شبا پرداخت کرده و سپس رسید پرداخت را بارگذاری کنید.</p>

              {status === "SUPPLY_POSSIBLE" ? (
                <label className="admin-btn admin-btn-primary flex items-center gap-2 justify-center mt-4 cursor-pointer">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? "در حال آپلود..." : "بارگذاری رسید و تأیید پرداخت"}
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} disabled={uploading} className="hidden" />
                </label>
              ) : localReceiptUrl && (
                <p className="text-green-600 text-xs mt-3">✓ رسید پرداخت ارسال شده و در انتظار بررسی ادمین است.</p>
              )}

              <div className="offline-payment-warning mt-4">
                در صورت تغییر مبلغ نهایی سفارش (کسر یا اضافه)، مابه‌التفاوت پس از هماهنگی دریافت یا مسترد خواهد شد.
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="support-chat">
          <div className="support-chat-messages">
            {messages.map((m) => (
              <div key={m.id} className={`support-msg${m.sender_role === "ADMIN" ? " admin" : " user"}`}>
                <div className="support-msg-bubble">
                  <span className="support-msg-sender">{m.sender_role === "ADMIN" ? `پشتیبانی — ${m.sender_name}` : m.sender_name}</span>
                  {m.message && <p>{m.message}</p>}
                  <span className="support-msg-time">{new Date(m.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="support-chat-input">
            <input type="text" placeholder="پیام خود را بنویسید..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} />
            <button onClick={handleSend} disabled={sending}><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}