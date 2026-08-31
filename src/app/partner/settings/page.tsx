import { requirePartnerForPage } from "@/lib/partners/auth";
import PartnerProfileForm from "@/components/partner/PartnerProfileForm";

export default async function PartnerSettingsPage() {
  const partner = await requirePartnerForPage();
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>تنظیمات پروفایل</h1>
      <PartnerProfileForm partner={partner} />
    </div>
  );
}