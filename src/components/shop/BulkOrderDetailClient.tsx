"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { sendUserBulkMessage, getBulkMessages } from "@/app/(shop)/bulk-order/message-actions";
import { payDepositOnline } from "@/app/(shop)/bulk-order/deposit-actions";
import BulkDepositBankList from "./BulkDepositBankList";

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی",
  SUPPLY_POSSIBLE: "قابل تأمین — منتظر پرداخت",
  AWAITING_PAYMENT_CONFIRMATION: "پرداخت در انتظار تأیید",
  PREPARING: "در حال تهیه",
  COMPLETED: "تکمیل‌شده / ارسال‌شده",
  NOT_POSSIBLE: "غیرقابل تأمین",
  CLOSED_UNPAID: "بسته شده — عدم پرداخت",
};

interface StoreItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}
interface MarketItem {
  name: string;
  quantity: number;
  minPrice: number | null;
  maxPrice: number | null;
  finalUnitPrice?: number | null;
}
interface Message {
  id: string;
  sender_role: string;
  sender_name: string;
  message: string | null;
  created_at: string;
}
interface Bank {
  id: string;
  bank_name: string;
  account_holder_name: string;
  card_number: string | null;
  sheba_number: string | null;
  logo_slug: string;
}

// هوک جایگزین برای دریافت زمان جاری بدون نقض قوانین React

export default function BulkOrderDetailClient({
  requestId,
  requestNumber,
  status,
  storeItems,
  marketItems,
  depositAmount,
  depositExpiresAt,
  banks,
  rejectionReason,
  initialMessages,
}: {
  requestId: string;
  requestNumber: string;
  status: string;
  storeItems: StoreItem[];
  marketItems: MarketItem[];
  depositAmount: number | null;
  depositExpiresAt: string | null;
  banks: Bank[];
  rejectionReason: string | null;
  initialMessages: Message[];
}) {
  const [view, setView] = useState<"details" | "messages">("details");
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number>(() => Date.now());

useEffect(() => {
  const timer = setInterval(() => setNow(Date.now()), 60000);
  return () => clearInterval(timer);
}, []);

  // محاسبه روزهای باقی‌مانده
  const daysLeft = depositExpiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(depositExpiresAt).getTime() - now) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  // اسکرول خودکار به انتهای پیام‌ها
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    await sendUserBulkMessage(requestId, text.trim());
    setText("");
    const fresh = await getBulkMessages(requestId);
    setMessages(fresh as Message[]);
    setSending(false);
  }

  async function handlePayOnline() {
    setPayingOnline(true);
    const result = await payDepositOnline(requestId);
    if (result?.error) {
      alert(result.error);
      setPayingOnline(false);
    }
  }

  const total = storeItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-white mb-1">
        سفارش جمعی {requestNumber}
      </h1>
      <p className="text-amber-400 text-sm mb-6">
        وضعیت: {statusLabels[status]}
      </p>

      {status === "SUPPLY_POSSIBLE" && (
        <div className="bulk-status-banner success">
          امکان تأمین کالاها فراهم شد. لطفاً بیعانه را
          {depositExpiresAt
            ? ` تا ${
                daysLeft?.toLocaleString("fa-IR") ?? "۰"
              } روز آینده`
            : ""}{" "}
          پرداخت نمایید — پس از پایان مهلت، این سفارش به‌صورت خودکار بسته می‌شود.
        </div>
      )}
      {status === "NOT_POSSIBLE" && rejectionReason && (
        <div className="bulk-status-banner error">
          متأسفانه امکان تأمین این درخواست وجود ندارد. دلیل: {rejectionReason}
        </div>
      )}
      {status === "CLOSED_UNPAID" && (
        <div className="bulk-status-banner error">
          مهلت پرداخت این سفارش به پایان رسید و بسته شد.
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView("details")}
          className={`order-tab${view === "details" ? " active" : ""}`}
        >
          جزئیات
        </button>
        <button
          onClick={() => setView("messages")}
          className={`order-tab${view === "messages" ? " active" : ""}`}
        >
          پیام‌ها
        </button>
      </div>

      {view === "details" ? (
        <>
          {storeItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-800 mb-3">
                کالاهای موجود در سایت
              </h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>تعداد</th>
                    <th>قیمت واحد</th>
                    <th>جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {storeItems.map((it, i) => (
                    <tr key={i}>
                      <td>{it.productName}</td>
                      <td>{it.quantity.toLocaleString("fa-IR")}</td>
                      <td>{it.unitPrice.toLocaleString("fa-IR")}</td>
                      <td>
                        {(it.quantity * it.unitPrice).toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm font-bold text-gray-800 mt-3">
                جمع تقریبی: {total.toLocaleString("fa-IR")} تومان
              </p>
            </div>
          )}

          {marketItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-800 mb-3">
                کالاهای درخواستی از بازار
              </h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>تعداد</th>
                    <th>بازه قیمت</th>
                    <th>قیمت نهایی</th>
                  </tr>
                </thead>
                <tbody>
                  {marketItems.map((it, i) => (
                    <tr key={i}>
                      <td>{it.name}</td>
                      <td>{it.quantity.toLocaleString("fa-IR")}</td>
                      <td>
                        {it.minPrice || it.maxPrice
                          ? `${(it.minPrice ?? 0).toLocaleString("fa-IR")} تا ${(
                              it.maxPrice ?? 0
                            ).toLocaleString("fa-IR")} تومان`
                          : "—"}
                      </td>
                      <td>
                        {it.finalUnitPrice
                          ? `${it.finalUnitPrice.toLocaleString("fa-IR")} تومان`
                          : "در انتظار قیمت‌گذاری"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {status === "SUPPLY_POSSIBLE" && depositAmount && banks.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="font-bold text-gray-800 mb-3">پرداخت بیعانه</h2>
              <p className="text-sm text-gray-700 mb-4">
                مبلغ بیعانه:{" "}
                <b>{depositAmount.toLocaleString("fa-IR")} تومان</b>
              </p>

              <button
                onClick={handlePayOnline}
                disabled={true}
                className="w-full rounded-full bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 mb-5 flex items-center justify-center gap-2"
              >
                {payingOnline && <Loader2 size={16} className="animate-spin" />}{" "}
                پرداخت از درگاه بانکی
              </button>

              <p className="text-xs text-gray-500 mb-3 text-center">
                یا پرداخت کارت‌به‌کارت / شبا:
              </p>
              <BulkDepositBankList requestId={requestId} banks={banks} />

              <div className="offline-payment-warning mt-4">
                در صورت تغییر مبلغ نهایی سفارش (کسر یا اضافه)، مابه‌التفاوت پس از
                هماهنگی دریافت یا مسترد خواهد شد.
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="support-chat">
          <div className="support-chat-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`support-msg${
                  m.sender_role === "ADMIN" ? " admin" : " user"
                }`}
              >
                <div className="support-msg-bubble">
                  <span className="support-msg-sender">
                    {m.sender_role === "ADMIN"
                      ? `پشتیبانی — ${m.sender_name}`
                      : m.sender_name}
                  </span>
                  {m.message && <p>{m.message}</p>}
                  <span className="support-msg-time">
                    {new Date(m.created_at).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="support-chat-input">
            <input
              type="text"
              placeholder="پیام خود را بنویسید..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <button onClick={handleSend} disabled={sending}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}