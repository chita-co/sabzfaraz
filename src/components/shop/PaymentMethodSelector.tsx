"use client";

import BankAccountDisplay, { type BankAccountInfo } from "./BankAccountDisplay";

export type PaymentMethod = "ONLINE" | "CARD_TO_CARD" | "SHEBA";

export default function PaymentMethodSelector({
  method,
  onMethodChange,
  bankAccounts,
  bankAccountId,
  onBankAccountChange,
  onlineEnabled = true,
}: {
  method: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  bankAccounts: BankAccountInfo[];
  bankAccountId: string;
  onBankAccountChange: (id: string) => void;
  onlineEnabled?: boolean;
}) {
  

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <h2 className="font-bold text-gray-800 mb-4">روش پرداخت</h2>

      <div className="payment-method-tabs">
        <div
          className={`payment-method-tab${method === "ONLINE" ? " active" : ""}${!onlineEnabled ? " disabled" : ""}`}
          onClick={() => onlineEnabled && onMethodChange("ONLINE")}
        >
          پرداخت آنلاین {!onlineEnabled && "(به‌زودی)"}
        </div>
        <div className={`payment-method-tab${method === "CARD_TO_CARD" ? " active" : ""}`} onClick={() => onMethodChange("CARD_TO_CARD")}>
          کارت به کارت
        </div>
        <div className={`payment-method-tab${method === "SHEBA" ? " active" : ""}`} onClick={() => onMethodChange("SHEBA")}>
          واریز به شبا
        </div>
      </div>

      {(method === "CARD_TO_CARD" || method === "SHEBA") && bankAccounts.length > 0 && (
        <>
          <div className="bank-accounts-row">
            {bankAccounts.map((b) => (
              <BankAccountDisplay
                key={b.id}
                account={b}
                mode={method === "CARD_TO_CARD" ? "card" : "sheba"}
                selected={bankAccountId === b.id}
                onSelect={() => onBankAccountChange(b.id)}
              />
            ))}
          </div>
          <div className="offline-payment-warning">
            لطفاً پس از ثبت سفارش، مبلغ را کارت به کارت/واریز کرده و از طریق «پشتیبانی» ما را از پرداخت مطلع کنید تا سفارش شما بررسی و پردازش شود.
          </div>
        </>
      )}
    </div>
  );
}