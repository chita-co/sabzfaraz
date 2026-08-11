"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Save, FileText, Printer } from "lucide-react";
import {
  updateBulkOrderItems, updateInternalNote, markSupplyPossible, markSupplyNotPossible,
  confirmDepositPayment, rejectDepositPayment, setBulkOrderStatusManually,
  sendAdminBulkMessage, getAdminBulkMessages,
} from "@/app/admin/bulk-orders/actions";


interface StoreItem { productId: string; productName: string; quantity: number; unitPrice: number; }
interface MarketItem { name: string; quantity: number; minPrice: number | null; maxPrice: number | null; finalUnitPrice?: number | null; }
interface BankAcc { id: string; bank_name: string; }
interface Message { id: string; sender_role: string; sender_name: string; message: string | null; created_at: string; }

interface BulkOrderRequest {
  id: string;
  request_number: string;
  status: string;
  profile?: { full_name?: string; phone?: string } | null;
  store_items?: StoreItem[];
  market_items?: MarketItem[];
  admin_internal_note?: string | null;
  deposit_amount?: number | null;
  bank_account_id?: string | null;
  rejection_reason?: string | null;
  deposit_payment_method?: string | null;
}

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی", SUPPLY_POSSIBLE: "قابل تأمین — منتظر پرداخت",
  AWAITING_PAYMENT_CONFIRMATION: "پرداخت در انتظار تأیید", PREPARING: "در حال تهیه",
  COMPLETED: "تکمیل‌شده / ارسال‌شده", NOT_POSSIBLE: "غیرقابل تأمین", CLOSED_UNPAID: "بسته شده — عدم پرداخت",
};

export default function BulkOrderAdminDetail({
  request, bankAccounts,
}: { request: BulkOrderRequest; bankAccounts: BankAcc[] }) {
  const [storeItems, setStoreItems] = useState<StoreItem[]>(request.store_items ?? []);
  const [marketItems, setMarketItems] = useState<MarketItem[]>(request.market_items ?? []);
  const [note, setNote] = useState(request.admin_internal_note ?? "");
  const [supplyChoice, setSupplyChoice] = useState<"REVIEWING" | "POSSIBLE" | "NOT_POSSIBLE">(
    request.status === "NOT_POSSIBLE" ? "NOT_POSSIBLE" : request.status === "PENDING_REVIEW" ? "REVIEWING" : "POSSIBLE"
  );
  const [depositAmount, setDepositAmount] = useState(request.deposit_amount?.toString() ?? "");
  const [bankAccountId, setBankAccountId] = useState(request.bank_account_id ?? bankAccounts[0]?.id ?? "");
  const [rejectionReason, setRejectionReason] = useState(request.rejection_reason ?? "");

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAdminBulkMessages(request.id).then(setMessages);
    const interval = setInterval(() => getAdminBulkMessages(request.id).then(setMessages), 5000);
    return () => clearInterval(interval);
  }, [request.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  function updateStoreItem(i: number, field: keyof StoreItem, value: string | number) {
    setStoreItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function removeStoreItem(i: number) { setStoreItems((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateMarketItem(i: number, field: keyof MarketItem, value: string | number | null) {
    setMarketItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function removeMarketItem(i: number) { setMarketItems((prev) => prev.filter((_, idx) => idx !== i)); }

  async function handleSaveItems() {
    setSaving(true);
    await updateBulkOrderItems(request.id, storeItems, marketItems);
    setSaving(false);
    alert("ذخیره شد.");
  }
  async function handleSaveNote() { await updateInternalNote(request.id, note); alert("یادداشت ذخیره شد."); }
  async function handleSaveSupplyStatus() {
    if (supplyChoice === "POSSIBLE") {
      if (!depositAmount || !bankAccountId) { alert("مبلغ بیعانه و حساب بانکی الزامی است."); return; }
      const result = await markSupplyPossible(request.id, Number(depositAmount), bankAccountId);
      if (result?.error) alert(result.error); else window.location.reload();
    } else if (supplyChoice === "NOT_POSSIBLE") {
      if (!rejectionReason.trim()) { alert("دلیل رد درخواست را وارد کنید."); return; }
      const result = await markSupplyNotPossible(request.id, rejectionReason);
      if (result?.error) alert(result.error); else window.location.reload();
    }
  }
  async function handleConfirmPayment() {
    if (!confirm("آیا از تأیید این پرداخت مطمئن هستید؟")) return;
    const result = await confirmDepositPayment(request.id);
    if (result?.error) alert(result.error); else window.location.reload();
  }
  async function handleRejectPayment() {
    if (!confirm("آیا از رد این پرداخت مطمئن هستید؟")) return;
    const result = await rejectDepositPayment(request.id);
    if (result?.error) alert(result.error); else window.location.reload();
  }
  async function handleManualStatus(status: string) {
    const result = await setBulkOrderStatusManually(request.id, status);
    if (result?.error) alert(result.error); else window.location.reload();
  }
  async function handleSendMessage() {
    if (!text.trim()) return;
    await sendAdminBulkMessage(request.id, text.trim());
    setText("");
    getAdminBulkMessages(request.id).then(setMessages);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-900">سفارش جمعی {request.request_number}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/bulk-orders/${request.id}/invoice-builder`} className="admin-btn admin-btn-primary flex items-center gap-2"><FileText size={14} /> ساخت فاکتور</Link>
          <Link href={`/admin/bulk-orders/${request.id}/shipping-label`} target="_blank" className="admin-btn admin-btn-secondary flex items-center gap-2"><Printer size={14} /> برچسب مرسوله</Link>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-1">مشتری: {request.profile?.full_name} — {request.profile?.phone}</p>
      <p className="text-sm mb-5"><span className="badge badge-warning">{statusLabels[request.status]}</span></p>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">کالاهای موجود در سایت</h2>
        {storeItems.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
            <input value={it.productName} onChange={(e) => updateStoreItem(i, "productName", e.target.value)} className="col-span-5 admin-input" />
            <input type="number" value={it.quantity} onChange={(e) => updateStoreItem(i, "quantity", Number(e.target.value))} className="col-span-2 admin-input" />
            <input type="number" value={it.unitPrice} onChange={(e) => updateStoreItem(i, "unitPrice", Number(e.target.value))} className="col-span-3 admin-input" />
            <button onClick={() => removeStoreItem(i)} className="col-span-2 admin-btn admin-btn-danger"><Trash2 size={13} /></button>
          </div>
        ))}

        <h2 className="font-bold text-gray-800 mb-3 mt-5">کالاهای درخواستی از بازار</h2>
        {marketItems.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
            <input value={it.name} onChange={(e) => updateMarketItem(i, "name", e.target.value)} className="col-span-3 admin-input" placeholder="نام" />
            <input type="number" value={it.quantity} onChange={(e) => updateMarketItem(i, "quantity", Number(e.target.value))} className="col-span-2 admin-input" placeholder="تعداد" />
            <input type="number" placeholder="از" value={it.minPrice ?? ""} onChange={(e) => updateMarketItem(i, "minPrice", e.target.value ? Number(e.target.value) : null)} className="col-span-2 admin-input" />
            <input type="number" placeholder="تا" value={it.maxPrice ?? ""} onChange={(e) => updateMarketItem(i, "maxPrice", e.target.value ? Number(e.target.value) : null)} className="col-span-2 admin-input" />
            <input type="number" placeholder="قیمت نهایی" value={it.finalUnitPrice ?? ""} onChange={(e) => updateMarketItem(i, "finalUnitPrice", e.target.value ? Number(e.target.value) : null)} className="col-span-2 admin-input" />
            <button onClick={() => removeMarketItem(i)} className="col-span-1 admin-btn admin-btn-danger"><Trash2 size={13} /></button>
          </div>
        ))}
        <button onClick={handleSaveItems} disabled={saving} className="admin-btn admin-btn-primary flex items-center gap-2 mt-3"><Save size={14} /> ذخیره اقلام</button>
      </div>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">وضعیت امکان تأمین</h2>
        <select value={supplyChoice} onChange={(e) => setSupplyChoice(e.target.value as "REVIEWING" | "POSSIBLE" | "NOT_POSSIBLE")} className="admin-input mb-3">
          <option value="REVIEWING">در حال بررسی</option>
          <option value="POSSIBLE">قابل تأمین است</option>
          <option value="NOT_POSSIBLE">غیرقابل تأمین است</option>
        </select>

        {supplyChoice === "POSSIBLE" && (
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="admin-form-group"><label>مبلغ بیعانه (تومان)</label><input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} /></div>
            <div className="admin-form-group">
              <label>حساب بانکی دریافت‌کننده</label>
              <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
                {bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
              </select>
            </div>
          </div>
        )}
        {supplyChoice === "NOT_POSSIBLE" && (
          <div className="admin-form-group mb-3"><label>دلیل رد (برای کاربر نمایش داده می‌شود)</label><textarea rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></div>
        )}
        {supplyChoice !== "REVIEWING" && <button onClick={handleSaveSupplyStatus} className="admin-btn admin-btn-primary">ذخیره و اعلام به کاربر</button>}
      </div>

      {request.status === "AWAITING_PAYMENT_CONFIRMATION" && (
        <div className="admin-card mb-5">
          <h2 className="font-bold text-gray-800 mb-3">تأیید پرداخت بیعانه</h2>
          <p className="text-sm text-gray-600 mb-3">کاربر پرداخت را از طریق {request.deposit_payment_method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"} اعلام کرده است.</p>
          <div className="flex gap-2">
            <button onClick={handleConfirmPayment} className="admin-btn admin-btn-primary">تأیید پرداخت</button>
            <button onClick={handleRejectPayment} className="admin-btn admin-btn-danger">رد پرداخت</button>
          </div>
        </div>
      )}

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">تغییر وضعیت دستی</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => handleManualStatus("PREPARING")} className="admin-btn admin-btn-secondary">در حال تهیه</button>
          <button onClick={() => handleManualStatus("COMPLETED")} className="admin-btn admin-btn-secondary">تکمیل‌شده / ارسال‌شده</button>
        </div>
      </div>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">یادداشت داخلی (فقط ادمین می‌بیند)</h2>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mb-3" />
        <button onClick={handleSaveNote} className="admin-btn admin-btn-secondary">ذخیره یادداشت</button>
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">گفتگو با مشتری</h2>
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
          <div className="support-chat-input">
            <input type="text" placeholder="پاسخ خود را بنویسید..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }} />
            <button onClick={handleSendMessage}><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}