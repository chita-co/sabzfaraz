import { requirePartnerForPage } from "@/lib/partners/auth";
import PartnerBulkPriceUpdateClient from "@/components/partner/PartnerBulkPriceUpdateClient";

export default async function PartnerBulkPriceUpdatePage() {
  await requirePartnerForPage();
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
        تغییر قیمت گروهی محصولات
      </h1>
      <PartnerBulkPriceUpdateClient />
    </div>
  );
}