"use client";

import { useState } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import Image from "next/image";
import {
  createBankAccount, updateBankAccount, toggleBankAccountActive, deleteBankAccount, updateBulkOrderSettings,
} from "@/app/admin/settings/bank-accounts/actions";
import AdminSwitch from "./AdminSwitch";

interface Account {
  id: string; bank_name: string; account_holder_name: string;
  card_number: string | null; sheba_number: string | null; logo_slug: string;
  is_active: boolean; sort_order: number;
}
interface BulkSettings { bulk_order_enabled: boolean; bulk_order_fee_type: string; bulk_order_fee_value: number; }

export default function BankAccountsManager({ accounts, bulkSettings }: { accounts: Account[]; bulkSettings: BulkSettings }) {
  const [rows, setRows] = useState(accounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function handleCreate(formData: FormData) {
    const result = await createBankAccount(formData);
    if (!result?.error) window.location.reload();
  }
  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateBankAccount(id, formData);
    if (!result?.error) window.location.reload();
  }
  async function handleToggle(id: string, value: boolean) {
    await toggleBankAccountActive(id, value);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: value } : r)));
  }
  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این حساب بانکی مطمئن هستید؟")) return;
    const result = await deleteBankAccount(id);
    if (result?.error) alert(result.error);
    else setRows((prev) => prev.filter((r) => r.id !== id));
  }
  async function handleBulkSettingsSave(formData: FormData) {
    await updateBulkOrderSettings(formData);
    alert("ذخیره شد.");
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">حساب‌های بانکی و تنظیمات سفارش جمعی</h1>

      <form action={handleBulkSettingsSave} className="admin-card mb-6" style={{ maxWidth: 480 }}>
        <h2 className="font-bold text-gray-800 mb-3">تنظیمات کارمزد سفارش جمعی</h2>
        <div className="admin-form-group flex items-center gap-2">
          <input type="checkbox" id="bulkEnabled" name="bulkOrderEnabled" defaultChecked={bulkSettings.bulk_order_enabled} />
          <label htmlFor="bulkEnabled" style={{ marginBottom: 0 }}>فعال بودن صفحه سفارش جمعی</label>
        </div>
        <div className="admin-form-group">
          <label>نوع کارمزد خدمات</label>
          <select name="feeType" defaultValue={bulkSettings.bulk_order_fee_type}>
            <option value="percent">درصدی</option>
            <option value="fixed">مبلغ ثابت (تومان)</option>
          </select>
        </div>
        <div className="admin-form-group">
          <label>مقدار کارمزد</label>
          <input type="number" name="feeValue" defaultValue={bulkSettings.bulk_order_fee_value} min={0} />
        </div>
        <button type="submit" className="admin-btn admin-btn-primary flex items-center gap-2"><Save size={14} /> ذخیره</button>
      </form>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800">حساب‌های بانکی</h2>
        <button onClick={() => setShowNew((v) => !v)} className="admin-btn admin-btn-primary flex items-center gap-2">
          <Plus size={14} /> افزودن حساب
        </button>
      </div>

      {showNew && (
        <form action={handleCreate} className="admin-card mb-4">
          <BankAccountFields />
          <button type="submit" className="admin-btn admin-btn-primary mt-3">ثبت</button>
        </form>
      )}

      <div className="space-y-4">
        {rows.map((acc) => (
          <div key={acc.id} className="admin-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Image
                  src={acc.logo_slug === "generic" ? "/banks/generic.svg" : `/banks/${acc.logo_slug}.png`}
                  alt={acc.bank_name}
                  width={32}
                  height={32}
                  style={{ borderRadius: 6 }}
                />
                <h3 className="font-bold text-gray-800">{acc.bank_name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <AdminSwitch checked={acc.is_active} onChange={(v) => handleToggle(acc.id, v)} label={acc.is_active ? "فعال" : "غیرفعال"} />
                <button onClick={() => setEditingId(editingId === acc.id ? null : acc.id)} className="admin-btn admin-btn-secondary">
                  {editingId === acc.id ? <X size={13} /> : "ویرایش"}
                </button>
                <button onClick={() => handleDelete(acc.id)} className="admin-btn admin-btn-danger"><Trash2 size={13} /></button>
              </div>
            </div>

            {editingId === acc.id ? (
              <form action={(fd) => handleUpdate(acc.id, fd)}>
                <BankAccountFields defaults={acc} />
                <button type="submit" className="admin-btn admin-btn-primary mt-3">ذخیره تغییرات</button>
              </form>
            ) : (
              <div className="text-sm text-gray-600 space-y-1">
                <p>صاحب حساب: {acc.account_holder_name}</p>
                {acc.card_number && <p dir="ltr">شماره کارت: {acc.card_number}</p>}
                {acc.sheba_number && <p dir="ltr">شبا: {acc.sheba_number}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BankAccountFields({ defaults }: { defaults?: Partial<Account> }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="admin-form-group"><label>نام بانک</label><input type="text" name="bankName" defaultValue={defaults?.bank_name} required /></div>
      <div className="admin-form-group"><label>نام صاحب حساب</label><input type="text" name="accountHolderName" defaultValue={defaults?.account_holder_name} required /></div>
      <div className="admin-form-group"><label>شماره کارت</label><input type="text" dir="ltr" name="cardNumber" defaultValue={defaults?.card_number ?? ""} placeholder="XXXX-XXXX-XXXX-XXXX" /></div>
      <div className="admin-form-group"><label>شماره شبا</label><input type="text" dir="ltr" name="shebaNumber" defaultValue={defaults?.sheba_number ?? ""} placeholder="IR..." /></div>
      <div className="admin-form-group">
        <label>لوگو</label>
        <select name="logoSlug" defaultValue={defaults?.logo_slug ?? "generic"}>
          <option value="bank-mellat">ملت</option>
          <option value="bank-saman">سامان بلو</option>
          <option value="bank-resalat">رسالت</option>
          <option value="generic">عمومی</option>
        </select>
      </div>
      <div className="admin-form-group"><label>ترتیب نمایش</label><input type="number" name="sortOrder" defaultValue={defaults?.sort_order ?? 0} /></div>
    </div>
  );
}