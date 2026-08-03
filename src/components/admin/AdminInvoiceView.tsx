"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";

export default function AdminInvoiceView({ html, fileName }: { html: string; fileName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    if (!ref.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(fileName);
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