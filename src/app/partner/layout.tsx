import { getCurrentPartner } from "@/lib/partners/auth";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import "./partner.css";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const partner = await getCurrentPartner();

  // فقط صفحات ورود/ثبت‌نام بدون احراز هویت قابل دسترسن
  // (این چک داخل خود صفحه‌ی login/register هم هست؛ اینجا برای بقیه‌ی مسیرهای partner/*)

  if (!partner) return <>{children}</>;

  if (partner.status === "PENDING_REVIEW") {
    return (
      <div className="partner-pending-screen">
        <h1>ثبت‌نام شما در انتظار بررسی است</h1>
        <p>درخواست همکاری شما ثبت شد. پس از بررسی توسط تیم سبزفراز، پیامک تأیید دریافت خواهید کرد.</p>
      </div>
    );
  }
  if (partner.status === "REJECTED") {
    return (
      <div className="partner-pending-screen">
        <h1>درخواست همکاری رد شده است</h1>
        <p>{partner.rejection_reason || "متأسفانه درخواست شما تأیید نشد."}</p>
      </div>
    );
  }
  if (partner.status === "SUSPENDED" || partner.status === "BLOCKED") {
    return (
      <div className="partner-pending-screen">
        <h1>حساب شما {partner.status === "SUSPENDED" ? "موقتاً تعلیق" : "مسدود"} شده است</h1>
        <p>برای اطلاعات بیشتر با پشتیبانی سبزفراز تماس بگیرید.</p>
      </div>
    );
  }

  return (
    <div className="partner-panel">
      <PartnerSidebar businessName={partner.business_name} logoUrl={partner.logo_url} />
      <main className="partner-main">{children}</main>
    </div>
  );
}