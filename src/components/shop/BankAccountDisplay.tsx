"use client";

export interface BankAccountInfo {
  id: string; bank_name: string; account_holder_name: string;
  card_number: string | null; sheba_number: string | null; logo_slug: string;
}

export default function BankAccountDisplay({
  account, mode, selected, onSelect,
}: {
  account: BankAccountInfo;
  mode: "card" | "sheba";
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`bank-account-card${selected ? " selected" : ""}${onSelect ? " clickable" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={account.logo_slug === "generic" ? "/banks/generic.svg" : `/banks/${account.logo_slug}.png`}
        alt={account.bank_name}
        className="bank-account-logo"
      />
      <p className="bank-account-name">{account.bank_name}</p>
      <p className="bank-account-holder">{account.account_holder_name}</p>
      <p className="bank-account-number" dir="ltr">
        {mode === "card" ? account.card_number : account.sheba_number}
      </p>
    </button>
  );
}