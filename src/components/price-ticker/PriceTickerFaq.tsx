"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const PRICE_TICKER_FAQS: { q: string; a: string }[] = [
  {
    q: "چرا قیمت دلار در سایت‌های مختلف کمی متفاوت است؟",
    a: "چون هر سایت قیمت را از منبع و لحظه‌ی متفاوتی می‌گیرد و بازار آزاد ارز به‌طور پیوسته در حال نوسان است. اختلاف چند صد تومانی طبیعی است و دلیلی بر نادرستی قیمت نیست.",
  },
  {
    q: "قیمت سکه چگونه محاسبه می‌شود؟",
    a: "قیمت سکه از دو بخش تشکیل می‌شود: ارزش ذاتی طلای داخل آن (بر اساس وزن، عیار و قیمت جهانی طلا) به‌علاوه‌ی «حباب» یعنی مابه‌التفاوتی که عرضه و تقاضای بازار داخلی سکه ایجاد می‌کند.",
  },
  {
    q: "تفاوت قیمت خرید و فروش چیست؟",
    a: "قیمت خرید، نرخی است که صرافی یا معامله‌گر ارز/طلا را از شما می‌خرد و قیمت فروش، نرخی است که به شما می‌فروشد. فاصله‌ی بین این دو (اسپرد) هزینه و ریسک معامله‌گر را پوشش می‌دهد.",
  },
  {
    q: "آیا قیمت‌های این صفحه دقیق و لحظه‌ای است؟",
    a: "قیمت‌ها هر ۳۰ ثانیه از منبع آنلاین به‌روزرسانی می‌شوند و برای اطلاع سریع از روند بازار مناسب‌اند. با این حال برای معاملات مهم، همیشه پیش از خرید یا فروش نهایی از صرافی یا طلافروشی موردنظرتان استعلام بگیرید.",
  },
  {
    q: "چرا قیمت طلا و دلار در طول روز این‌قدر تغییر می‌کند؟",
    a: "چون این دو بازار به‌صورت پیوسته و در ساعات فعالیت بازار آزاد معامله می‌شوند و هر خبر اقتصادی یا سیاسی می‌تواند بلافاصله روی عرضه و تقاضا و در نتیجه قیمت اثر بگذارد.",
  },
  {
    q: "قیمت ارزهای دیجیتال از کجا می‌آید و چقدر قابل‌اعتماد است؟",
    a: "قیمت ارزهای دیجیتال این صفحه مستقیماً از CoinGecko گرفته می‌شود؛ یکی از معتبرترین و پراستفاده‌ترین منابع قیمت رمزارز در دنیا که میانگین قیمت را از ده‌ها صرافی بین‌المللی محاسبه می‌کند. معادل تومانی هم بر اساس آخرین نرخ لحظه‌ای دلار همین صفحه محاسبه می‌شود.",
  },
  {
    q: "چطور می‌توانم یک قیمت را با دوستانم به اشتراک بگذارم؟",
    a: "روی هر نمودار قیمت، دکمه‌ی «اشتراک‌گذاری» را می‌بینید که یک متن آماده شامل نام، قیمت و درصد تغییر همراه با لینک صفحه را در تلگرام، واتساپ یا هر اپلیکیشن دیگری برایتان باز می‌کند.",
  },
];

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
