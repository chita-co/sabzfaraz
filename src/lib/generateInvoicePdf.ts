"use client";

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297; // A4

export async function renderInvoiceToPdf(html: string, fileName: string) {
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  container.style.width = PAGE_WIDTH_MM + "mm";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);

  const target = container.firstElementChild as HTMLElement;
  target.style.width = PAGE_WIDTH_MM + "mm";
  target.style.margin = "0 auto";

  try {
    // scale=3 برای کیفیت بهتر
    const canvas = await html2canvas(target, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    // ابعاد پیکسلی صفحه A4 با همان نسبت canvas
    const pageWidthPx = canvas.width;
    const pageHeightPx = Math.floor(
      pageWidthPx * (PAGE_HEIGHT_MM / PAGE_WIDTH_MM)
    );

    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    for (let i = 0; i < totalPages; i++) {
      const sourceY = i * pageHeightPx;
      const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

      // برش canvas به اندازه همان بخش صفحه
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = pageWidthPx;
      pageCanvas.height = sourceHeight;
      const ctx = pageCanvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        pageWidthPx,
        sourceHeight,
        0,
        0,
        pageWidthPx,
        sourceHeight
      );

      const imgData = pageCanvas.toDataURL("image/png");

      if (i > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        PAGE_WIDTH_MM,
        (sourceHeight * PAGE_WIDTH_MM) / pageWidthPx
      );
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}