"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { UploadCloud, Download } from "lucide-react";
import { bulkCreatePartnerProductsAction } from "@/app/partner/products/bulk-actions";

interface ParsedRow { title: string; description: string; categoryName: string; sellPrice: number; partnerCostPrice: number; stock: number; stockUnlimited: boolean; }

export default function BulkExcelUpload() {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<{ row: number; title: string; success: boolean; error?: string }[] | null>(null);
  const [uploading, setUploading] = useState(false);

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      { "عنوان محصول": "مته ۲ میلی‌متر", "توضیحات": "", "نام دسته‌بندی": "ابزار و تجهیزات", "قیمت فروش": 50000, "قیمت همکار": 40000, "موجودی": 10, "نامحدود (بله/خیر)": "خیر" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "محصولات");
    XLSX.writeFile(wb, "قالب-محصولات-سبزفراز.xlsx");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);
      const parsed: ParsedRow[] = json.map((r) => ({
        title: String(r["عنوان محصول"] || ""),
        description: String(r["توضیحات"] || ""),
        categoryName: String(r["نام دسته‌بندی"] || ""),
        sellPrice: Number(r["قیمت فروش"]) || 0,
        partnerCostPrice: Number(r["قیمت همکار"]) || 0,
        stock: Number(r["موجودی"]) || 0,
        stockUnlimited: String(r["نامحدود (بله/خیر)"] || "").trim() === "بله",
      }));
      setRows(parsed);
      setResults(null);
    };
    reader.readAsBinaryString(file);
  }

  async function handleSubmit() {
    if (rows.length === 0) return toast.error("ابتدا فایل اکسل را انتخاب کنید.");
    setUploading(true);
    const res = await bulkCreatePartnerProductsAction(rows);
    setUploading(false);
    setResults(res.results);
    const successCount = res.results.filter((r) => r.success).length;
    toast.success(`${successCount} از ${res.results.length} محصول با موفقیت ثبت شد.`);
    router.refresh();
  }

  return (
    <div className="partner-card">
      <h2 style={{ fontWeight: 800, marginBottom: 12 }}>افزودن گروهی محصولات با اکسل</h2>
      <button onClick={downloadTemplate} className="partner-btn partner-btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Download size={14} /> دانلود قالب اکسل نمونه
      </button>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
      {rows.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "10px 0" }}>{rows.length} ردیف شناسایی شد.</p>
          <button onClick={handleSubmit} disabled={uploading} className="partner-btn partner-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <UploadCloud size={14} /> {uploading ? "در حال ثبت..." : "ثبت همه‌ی محصولات"}
          </button>
        </>
      )}
      {results && (
        <div style={{ marginTop: 14 }}>
          {results.map((r) => (
            <p key={r.row} style={{ fontSize: 12, color: r.success ? "#16a34a" : "#dc2626" }}>
              ردیف {r.row} ({r.title}): {r.success ? "ثبت شد ✓" : r.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}