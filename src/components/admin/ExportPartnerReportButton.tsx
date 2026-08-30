"use client";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

interface Row { name: string; status: string; rating: number; totalSales: number; siteProfit: number; totalPenalty: number; totalSettled: number; }

export default function ExportPartnerReportButton({ rows }: { rows: Row[] }) {
  function handleExport() {
    const ws = XLSX.utils.json_to_sheet(rows.map((r) => ({
      "نام همکار": r.name, "وضعیت": r.status, "امتیاز": r.rating,
      "فروش کل": r.totalSales, "سود سایت": r.siteProfit, "مجموع جریمه": r.totalPenalty, "مجموع تسویه": r.totalSettled,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "گزارش همکاران");
    XLSX.writeFile(wb, `گزارش-مالی-همکاران-${new Date().toLocaleDateString("fa-IR")}.xlsx`);
  }
  return (
    <button onClick={handleExport} className="admin-btn admin-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Download size={15} /> خروجی اکسل
    </button>
  );
}