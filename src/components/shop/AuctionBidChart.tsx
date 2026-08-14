"use client";

interface Point { amount: number; createdAt: string; }

export default function AuctionBidChart({ points, basePrice }: { points: Point[]; basePrice: number }) {
  const sorted = [...points].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (sorted.length < 2) {
    return <p className="text-xs text-gray-400 text-center py-6">برای نمایش نمودار، حداقل به دو پیشنهاد نیاز است.</p>;
  }

  const values = [basePrice, ...sorted.map((p) => p.amount)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 600;
  const height = 160;
  const padding = 10;

  const coords = sorted.map((p, i) => ({
    x: padding + (i / (sorted.length - 1)) * (width - padding * 2),
    y: height - padding - ((p.amount - min) / range) * (height - padding * 2),
    amount: p.amount,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padding} L ${coords[0].x.toFixed(1)} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 180 }}>
      <defs>
        <linearGradient id="auctionChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#auctionChartFill)" />
      <path d={pathD} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 4 : 2.5} fill="#16a34a" />
      ))}
    </svg>
  );
}