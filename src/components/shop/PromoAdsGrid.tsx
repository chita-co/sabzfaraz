import Link from "next/link";
import { PromoAd } from "@/types";

export default function PromoAdsGrid({ ads }: { ads: PromoAd[] }) {
  const items = (ads ?? []).filter((a) => a.is_active).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="promo-ads-grid" data-count={items.length}>
        {items.map((ad) => {
          const content = (
            <div className="promo-ad-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.image_url} alt={ad.title ?? "تبلیغ"} loading="lazy" className="promo-ad-img" />
              {(ad.title || ad.description) && (
                <div className="promo-ad-overlay">
                  {ad.title && <h3 className="promo-ad-title">{ad.title}</h3>}
                  {ad.description && <p className="promo-ad-desc">{ad.description}</p>}
                </div>
              )}
            </div>
          );
          return ad.link_url ? (
            <Link key={ad.id} href={ad.link_url} className="promo-ad-link">{content}</Link>
          ) : (
            <div key={ad.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}