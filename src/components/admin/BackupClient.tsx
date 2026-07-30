"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function BackupClient() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sabzfaraz-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("خطا در دریافت فایل پشتیبان.");
    }
    setLoading(false);
  }

  return (
    <div className="admin-card">
      <h1 className="text-xl font-bold text-gray-900 mb-2">پشتیبان‌گیری از اطلاعات</h1>
      <p className="text-sm text-gray-500 mb-5">
        با این دکمه، یک فایل JSON شامل تمام دسته‌بندی‌ها، محصولات و سفارش‌های فروشگاه دانلود می‌شود که می‌توانید برای بایگانی نگه دارید.
      </p>
      <button onClick={handleDownload} disabled={loading} className="admin-btn admin-btn-primary flex items-center gap-2">
        <Download size={16} /> {loading ? "در حال آماده‌سازی..." : "دانلود فایل پشتیبان"}
      </button>
    </div>
  );
}