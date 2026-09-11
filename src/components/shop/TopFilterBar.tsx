import { Package, Boxes, Users, Handshake, Eye } from "lucide-react";

export default function TopFilterBar({
  totalProducts,
  totalStock,
  totalUsers,
  totalPartners,
  totalVisits,
}: {
  totalProducts: number;
  totalStock: number;
  totalUsers: number;
  totalPartners: number;
  totalVisits: number;
}) {
  const stats = [
    { icon: Package, value: totalProducts, label: "محصول در سبزفراز" },
    { icon: Boxes, value: totalStock, label: "موجودی کالاها" },
    { icon: Users, value: totalUsers, label: "کاربران فعال" },
    { icon: Handshake, value: totalPartners, label: "همکار" },
    { icon: Eye, value: totalVisits, label: "بازدیدها" },
  ];

  return (
    <div className="top-filter-bar">
      <div className="top-filter-bar-inner site-stats-bar-inner">
        <div className="site-stats-bar">
          <span className="site-stats-live-dot" />
          {stats.map((s, i) => (
            <div className="site-stats-item" key={s.label}>
              {i > 0 && <span className="site-stats-divider">/</span>}
              <span className="site-stats-icon">
                <s.icon size={16} />
              </span>
              <span className="site-stats-text">
                <strong className="site-stats-number">{s.value.toLocaleString("fa-IR")}</strong>
                <span className="site-stats-label">{s.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}