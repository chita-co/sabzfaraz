"use client";

// اسپارک‌لاین سبک و بدون وابستگی (بدون recharts) — فقط برای کارت‌های بزرگ
// بالای صفحه که باید در نگاه اول (چشم‌نوازی + اسکن سریع) روند قیمت را نشان دهند.

export default function InlineSparkline({
  points,
  positive,
  width = 96,
  height = 32,
}: {
  points: number[];
  positive: boolean;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) {
    return <div style={{ width, height }} />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return [x, y];
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const color = positive ? "#22c55e" : "#ef4444";
  const gradientId = `spark-grad-${positive ? "up" : "down"}-${width}-${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
