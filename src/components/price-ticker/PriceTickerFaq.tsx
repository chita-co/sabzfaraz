"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PRICE_TICKER_FAQS } from "./priceTickerFaqs";

export default function PriceTickerFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="pt-faq">
      <div className="pt-faq-inner">
        <h2>سوالات متداول</h2>
        <div className="pt-faq-list">
          {PRICE_TICKER_FAQS.map((item, i) => (
            <div key={item.q} className="pt-faq-item">
              <button className="pt-faq-q" onClick={() => setOpen(open === i ? null : i)}>
                <span>{item.q}</span>
                <ChevronDown size={18} className={open === i ? "pt-faq-icon open" : "pt-faq-icon"} />
              </button>
              {open === i && <p className="pt-faq-a">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pt-faq { background:#f8fafc; padding: 8px 16px 56px; }
        .pt-faq-inner { max-width:860px; margin:0 auto; }
        .pt-faq h2 { font-size:20px; font-weight:800; color:#111827; margin-bottom:16px; }
        .pt-faq-list { display:flex; flex-direction:column; gap:10px; }
        .pt-faq-item { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding: 4px 16px; }
        .pt-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; gap:10px; background:none; border:none; padding:14px 0; text-align:right; font-size:14.5px; font-weight:700; color:#1f2937; cursor:pointer; }
        .pt-faq-icon { transition: transform .2s; color:#9ca3af; flex-shrink:0; }
        .pt-faq-icon.open { transform: rotate(180deg); }
        .pt-faq-a { font-size:13.5px; color:#4b5563; line-height:2; padding-bottom:16px; margin:0; }
      `}</style>
    </section>
  );
}
