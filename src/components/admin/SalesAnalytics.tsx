"use client";

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";

interface ChartPoint { label: string; amount: number; }
interface TopProduct { name: string; quantity: number; revenue: number; }

export default function SalesAnalytics({
  dailyData,
  monthlyData,
  topProducts,
  stats,
}: {
  dailyData: ChartPoint[];
  monthlyData: ChartPoint[];
  topProducts: TopProduct[];
  stats: { totalRevenue: number; totalOrders: number; avgOrderValue: number; totalCustomers: number };
}) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">گزارش فروش</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#16a34a" }}><DollarSign size={22} /></div>
          <div>
            <div className="stat-value">{stats.totalRevenue.toLocaleString("fa-IR")}</div>
            <div className="stat-label">درآمد ۱۲ ماه اخیر (تومان)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#3b82f6" }}><ShoppingCart size={22} /></div>
          <div>
            <div className="stat-value">{stats.totalOrders.toLocaleString("fa-IR")}</div>
            <div className="stat-label">تعداد سفارش پرداخت‌شده</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f59e0b" }}><TrendingUp size={22} /></div>
          <div>
            <div className="stat-value">{stats.avgOrderValue.toLocaleString("fa-IR")}</div>
            <div className="stat-label">میانگین ارزش سفارش (تومان)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#8b5cf6" }}><Users size={22} /></div>
          <div>
            <div className="stat-value">{stats.totalCustomers.toLocaleString("fa-IR")}</div>
            <div className="stat-label">تعداد کاربران</div>
          </div>
        </div>
      </div>

      <div className="admin-card mb-6">
        <h2 className="font-bold text-gray-800 mb-4">فروش ۳۰ روز اخیر</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString("fa-IR") + " تومان" : "")} />
            <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-card mb-6">
        <h2 className="font-bold text-gray-800 mb-4">فروش ۱۲ ماه اخیر</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => (typeof v === "number" ? v.toLocaleString("fa-IR") + " تومان" : "")} />
            <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-4">پرفروش‌ترین محصولات</h2>
        <table className="admin-table">
          <thead>
            <tr><th>رتبه</th><th>نام محصول</th><th>تعداد فروش</th><th>درآمد</th></tr>
          </thead>
          <tbody>
            {topProducts.map((p, i) => (
              <tr key={i}>
                <td>{(i + 1).toLocaleString("fa-IR")}</td>
                <td>{p.name}</td>
                <td>{p.quantity.toLocaleString("fa-IR")}</td>
                <td>{p.revenue.toLocaleString("fa-IR")} تومان</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topProducts.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">هنوز سفارش پرداخت‌شده‌ای ثبت نشده است.</p>
        )}
      </div>
    </div>
  );
}