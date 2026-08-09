"use client";

import { CreditCard, Landmark } from "lucide-react";

export interface BankAccountInfo {
  id: string; bank_name: string; account_holder_name: string;
  card_number: string | null; sheba_number: string | null; logo_slug: string;
}

export default function BankAccountDisplay({
  account, mode,
}: { account: BankAccountInfo; mode: "card" | "sheba" }) {
  return (
    <div className="bank-account-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/banks/${account.logo_slug}.svg`} alt={account.bank_name} className="bank-account-logo" />
      <div className="bank-account-info">
        <p className="bank-account-name">{account.bank_name}</p>
        <p className="bank-account-holder">به نام: {account.account_holder_name}</p>
        <div className="bank-account-number-row">
          {mode === "card" ? <CreditCard size={14} /> : <Landmark size={14} />}
          <span dir="ltr" className="bank-account-number">
            {mode === "card" ? account.card_number : account.sheba_number}
          </span>
        </div>
      </div>
    </div>
  );
}