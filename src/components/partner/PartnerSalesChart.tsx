"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { WeeklySalesPoint } from "@/lib/partners/stats";

export default function PartnerSalesChart({ data }: { data: WeeklySalesPoint[] }) {
  return (
    <div className="partner-card">
      <h2 style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>روند فروش (۸ هفته اخیر)</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <XAxis dataKey="week" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip formatter={(value: number | string | readonly (string | number)[] | undefined) => {
  const numericValue = Array.isArray(value)
    ? Number(value[0] ?? 0)
    : typeof value === 'number'
      ? value
      : Number(value ?? 0);
  return `${numericValue.toLocaleString("fa-IR")} تومان`;
}} />
          <Bar dataKey="sales" fill="#16a34a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}