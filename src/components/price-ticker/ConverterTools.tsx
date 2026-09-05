"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Gem } from "lucide-react";
import type { PriceItem } from "@/types/priceTicker";

function toman(n: number): string {
  return Math.round(n).toLocaleString("fa-IR");
}

const KARATS: { key: string; label: string; factor: number }[] = [
  { key: "24", label: "۲۴ عیار", factor: 1 / 0.75 },
  { key: "21", label: "۲۱ عیار", factor: (1 / 0.75) * 0.875 },
  { key: "18", label: "۱۸ عیار", factor: 1 },
];

export default function ConverterTools({ currencyItems, goldItems }: { currencyItems: PriceItem[]; goldItems: PriceItem[] }) {
  // ---------------- مبدل ارز ----------------
  const [amount, setAmount] = useState<string>("100");
  const [currencySymbol, setCurrencySymbol] = useState<string>(currencyItems[0]?.symbol ?? "");
  const selectedCurrency = currencyItems.find((c) => c.symbol === currencySymbol) ?? currencyItems[0];
  const convertedToman = selectedCurrency ? (Number(amount) || 0) * selectedCurrency.price : 0;

  // ---------------- ماشین‌حساب طلا / سکه ----------------
  const [mode, setMode] = useState<"gold" | "coin">("gold");
  const gold18 = goldItems.find((g) => g.name.includes("۱۸")) ?? goldItems[0];
  const coinItems = goldItems.filter((g) => g.name.includes("سکه"));

  const [weight, setWeight] = useState<string>("1");
  const [karat, setKarat] = useState<string>("18");
  const [wagePercent, setWagePercent] = useState<string>("7");
  const [profitPercent, setProfitPercent] = useState<string>("7");
  const [vatPercent, setVatPercent] = useState<string>("9");
  const [coinSymbol, setCoinSymbol] = useState<string>(coinItems[0]?.symbol ?? "");
  const selectedCoin = coinItems.find((c) => c.symbol === coinSymbol) ?? coinItems[0];

  const goldCalc = useMemo(() => {
    if (!gold18) return null;
    const factor = KARATS.find((k) => k.key === karat)?.factor ?? 1;
    const pricePerGram = gold18.price * factor;
    const base = (Number(weight) || 0) * pricePerGram;
    const wage = base * ((Number(wagePercent) || 0) / 100);
    const profit = (base + wage) * ((Number(profitPercent) || 0) / 100);
    const vat = (wage + profit) * ((Number(vatPercent) || 0) / 100);
    const total = base + wage + profit + vat;
    return { pricePerGram, base, wage, profit, vat, total };
  }, [gold18, weight, karat, wagePercent, profitPercent, vatPercent]);

  return (
    <div className="pt-tools">
      <div className="pt-tool-card">
        <div className="pt-tool-head">
          <ArrowLeftRight size={16} />
          مبدل ارز
        </div>
        <div className="pt-tool-body">
          <div className="pt-field-row">
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="مقدار" />
            <select value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)}>
              {currencyItems.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-tool-result">
            <span>معادل تقریبی:</span>
            <strong>{toman(convertedToman)} تومان</strong>
          </div>
        </div>
      </div>

      <div className="pt-tool-card">
        <div className="pt-tool-head">
          <Gem size={16} />
          ماشین‌حساب طلا و سکه
        </div>

        <div className="pt-mode-switch">
          <button className={mode === "gold" ? "active" : ""} onClick={() => setMode("gold")}>
            طلای وزنی
          </button>
          <button className={mode === "coin" ? "active" : ""} onClick={() => setMode("coin")}>
            سکه
          </button>
        </div>

        {mode === "gold" ? (
          <div className="pt-tool-body">
            <div className="pt-field-grid">
              <label>
                وزن (گرم)
                <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
              <label>
                عیار
                <select value={karat} onChange={(e) => setKarat(e.target.value)}>
                  {KARATS.map((k) => (
                    <option key={k.key} value={k.key}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                اجرت ساخت (٪)
                <input inputMode="decimal" value={wagePercent} onChange={(e) => setWagePercent(e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
              <label>
                سود فروشنده (٪)
                <input inputMode="decimal" value={profitPercent} onChange={(e) => setProfitPercent(e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
              <label>
                مالیات ارزش‌افزوده (٪)
                <input inputMode="decimal" value={vatPercent} onChange={(e) => setVatPercent(e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
            </div>

            {goldCalc && (
              <div className="pt-breakdown">
                <div className="pt-breakdown-row">
                  <span>قیمت پایه طلا</span>
                  <span>{toman(goldCalc.base)} تومان</span>
                </div>
                <div className="pt-breakdown-row">
                  <span>اجرت ساخت</span>
                  <span>{toman(goldCalc.wage)} تومان</span>
                </div>
                <div className="pt-breakdown-row">
                  <span>سود فروشنده</span>
                  <span>{toman(goldCalc.profit)} تومان</span>
                </div>
                <div className="pt-breakdown-row">
                  <span>مالیات ارزش‌افزوده</span>
                  <span>{toman(goldCalc.vat)} تومان</span>
                </div>
                <div className="pt-tool-result total">
                  <span>قیمت تقریبی نهایی</span>
                  <strong>{toman(goldCalc.total)} تومان</strong>
                </div>
              </div>
            )}
            <p className="pt-tool-note">
              این محاسبه تقریبی است و بسته به طرح، اجرت دقیق طلافروش و شرایط بازار ممکن است با قیمت واقعی فروشگاه‌ها کمی تفاوت داشته باشد.
            </p>
          </div>
        ) : (
          <div className="pt-tool-body">
            {coinItems.length === 0 ? (
              <p className="pt-tool-note">اطلاعات سکه هنوز دریافت نشده — چند لحظه بعد دوباره امتحان کنید.</p>
            ) : (
              <>
                <div className="pt-field-row">
                  <select value={coinSymbol} onChange={(e) => setCoinSymbol(e.target.value)}>
                    {coinItems.map((c) => (
                      <option key={c.symbol} value={c.symbol}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCoin && (
                  <>
                    <div className="pt-tool-result total">
                      <span>قیمت لحظه‌ای بازار</span>
                      <strong>{toman(selectedCoin.price)} تومان</strong>
                    </div>
                    {typeof selectedCoin.bubblePercent === "number" && (
                      <div className={`pt-bubble-note ${selectedCoin.bubblePercent >= 0 ? "pos" : "neg"}`}>
                        حباب سکه نسبت به ارزش ذاتی طلای داخل آن (تقریبی): {selectedCoin.bubblePercent >= 0 ? "+" : ""}
                        {selectedCoin.bubblePercent.toLocaleString("fa-IR")}٪
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .pt-tools { max-width:1100px; margin: 22px auto 0; display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
        @media (max-width: 860px) { .pt-tools { grid-template-columns: 1fr; } }
        .pt-tool-card { background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:18px; padding:18px; color:#e5e7eb; }
        .pt-tool-head { display:flex; align-items:center; gap:8px; font-weight:700; font-size:14px; color:#fbbf24; margin-bottom:14px; }
        .pt-mode-switch { display:flex; gap:6px; background:rgba(255,255,255,.05); border-radius:999px; padding:4px; margin-bottom:14px; width:fit-content; }
        .pt-mode-switch button { border:none; background:transparent; color:#9ca3af; font-size:12px; font-weight:700; padding:6px 14px; border-radius:999px; cursor:pointer; }
        .pt-mode-switch button.active { background:#16a34a; color:#fff; }
        .pt-field-row { display:flex; gap:8px; }
        .pt-field-row input { flex:1; }
        .pt-field-row select { min-width: 130px; flex:1; }
        .pt-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
        .pt-field-grid label { display:flex; flex-direction:column; gap:4px; font-size:11.5px; color:#9ca3af; }
        input, select {
          background: rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); color:#fff;
          border-radius:10px; padding:9px 12px; font-size:13.5px; outline:none;
        }
        input:focus, select:focus { border-color:#fbbf24; }
        .pt-breakdown { display:flex; flex-direction:column; gap:4px; margin-top:4px; }
        .pt-breakdown-row { display:flex; justify-content:space-between; font-size:12px; color:#9ca3af; padding: 3px 2px; }
        .pt-tool-result { display:flex; align-items:center; justify-content:space-between; background:rgba(251,191,36,.1); border:1px solid rgba(251,191,36,.3); border-radius:10px; padding:10px 14px; margin-top:10px; font-size:13px; }
        .pt-tool-result strong { color:#fbbf24; font-size:15px; }
        .pt-tool-note { font-size:11px; color:#6b7280; margin-top:10px; line-height:1.8; }
        .pt-bubble-note { margin-top:10px; font-size:12px; padding:8px 12px; border-radius:10px; }
        .pt-bubble-note.pos { background:rgba(239,68,68,.1); color:#f87171; }
        .pt-bubble-note.neg { background:rgba(34,197,94,.1); color:#4ade80; }
      `}</style>
    </div>
  );
}
