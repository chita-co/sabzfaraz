import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Send, Phone, Mail, MapPin } from "lucide-react";
import TrustBadges from "./TrustBadges";

// آیکون SVG اینستاگرام جایگزین (به دلیل حذف از lucide-react)
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default async function Footer() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("store_name, support_phone, support_email, store_address")
    .eq("id", 1)
    .single();

  const storeName = settings?.store_name ?? "سبزفراز";
  const phone = settings?.support_phone ?? "021-00000000";
  const email = settings?.support_email ?? "support@sabzfaraz.ir";
  const address = settings?.store_address ?? "ایران، تهران";

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>{storeName}</h3>
            <p>
              فروشگاه اینترنتی تخصصی قطعات و تجهیزات الکترونیک — سیم و کابل،
              ماژول، سنسور، ابزار و دستگاه‌های موردنیاز پروژه‌های شما، با ارسال
              سریع به سراسر کشور.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="اینستاگرام"><InstagramIcon size={16} /></a>
              <a href="#" aria-label="تلگرام"><Send size={16} /></a>
            </div>
            <div className="footer-trust-row">
              <div className="footer-enamad">
                <a
                  referrerPolicy="origin"
                  target="_blank"
                  href="https://trustseal.enamad.ir/?id=771198&Code=xJTGAB5Hqaj2vITUvbXueKZ5VdtlPdHk"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    referrerPolicy="origin"
                    src="https://trustseal.enamad.ir/logo.aspx?id=771198&Code=xJTGAB5Hqaj2vITUvbXueKZ5VdtlPdHk"
                    alt="نماد اعتماد الکترونیکی"
                    style={{ cursor: "pointer" }}
                  />
                </a>
              </div>
              <TrustBadges />
            </div>
          </div>

          <div className="footer-col">
            <h4>بخش‌های فروشگاه</h4>
            <Link href="/">صفحه اصلی</Link>
            <Link href="/deals">جشنواره تخفیف</Link>
            <Link href="/unboxing">آنباکس مشتریان</Link>
            <Link href="/cart">سبد خرید</Link>
            <Link href="/wishlist">علاقه‌مندی‌ها</Link>
          </div>

          <div className="footer-col">
            <h4>بخش‌های سایت</h4>
            <Link href="/about">درباره ما</Link>
            <Link href="/contact">تماس با ما</Link>
            <Link href="/faq">سوالات متداول</Link>
            <Link href="/terms">قوانین و مقررات</Link>
            <Link href="/privacy">حریم خصوصی</Link>
          </div>

          <div className="footer-col footer-contact-col">
            <h4>اطلاعات تماس</h4>
            <p className="footer-contact-line"><Phone size={14} /> <span dir="ltr">{phone}</span></p>
            <p className="footer-contact-line"><Mail size={14} /> <span dir="ltr">{email}</span></p>
            <p className="footer-contact-line"><MapPin size={14} /> {address}</p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {storeName}. تمامی حقوق محفوظ است.</span>
          <span>ساخته‌شده با ❤ برای علاقه‌مندان الکترونیک</span>
        </div>
      </div>
    </footer>
  );
}