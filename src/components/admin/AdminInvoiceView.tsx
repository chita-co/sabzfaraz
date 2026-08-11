"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { renderInvoiceToPdf } from "@/lib/generateInvoicePdf";

export default function AdminInvoiceView({ html, fileName }: { html: string; fileName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      await renderInvoiceToPdf(html, fileName);
    } catch (e) {
      console.error(e);
      alert("خطا در ساخت PDF.");
    }
    setGenerating(false);
  }

  return (
    <div>
      <div className="no-print flex justify-end mb-4">
        <button onClick={handleDownload} disabled={generating} className="admin-btn admin-btn-primary flex items-center gap-2">
          <Download size={16} /> {generating ? "در حال ساخت..." : "دانلود PDF"}
        </button>
      </div>
      <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}