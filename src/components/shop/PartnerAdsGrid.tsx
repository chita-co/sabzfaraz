import Link from "next/link";
import { Banner } from "@/types";

export default function PartnerAdsGrid({ banners }: { banners: Banner[] }) {
  if (!banners || banners.length === 0) return null;
  const items = banners.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="section-title" style={{ marginBottom: 14 }}>همکاران و فروشگاه‌های ویژه</h2>
      <div className="partner-ads-grid">
        {items.map((b, i) => {
          const inner = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.image_url} alt={`بنر همکار ${i + 1}`} loading="lazy" className="partner-ads-img" />
          );
          return (
            <div className="partner-ads-cell" key={b.id} style={{ animationDelay: `${i * 80}ms` }}>
              {b.link_url ? <Link href={b.link_url}>{inner}</Link> : inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}