"use client";

const A5_LANDSCAPE_HEIGHT_MM = 148;
const A4_HEIGHT_MM = 297;
const WIDTH_MM = 210;

export async function renderInvoiceToPdf(html: string, fileName: string) {
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  container.innerHTML = html;
  document.body.appendChild(container);
  const target = container.firstElementChild as HTMLElement;

  try {
    const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const contentHeightMM = (canvas.height * WIDTH_MM) / canvas.width;
    const imgData = canvas.toDataURL("image/png");

    if (contentHeightMM <= A4_HEIGHT_MM) {
      // محتوای کوتاه: صفحه‌ای دقیقاً به‌اندازه‌ی محتوا (حداقل نیم برگ A4 = A5 افقی)
      const pageHeightMM = Math.max(A5_LANDSCAPE_HEIGHT_MM, contentHeightMM);
      const pdf = new jsPDF({ unit: "mm", format: [WIDTH_MM, pageHeightMM] });
      pdf.addImage(imgData, "PNG", 0, 0, WIDTH_MM, contentHeightMM);
      pdf.save(fileName);
    } else {
      // محتوای بلند: تقسیم چندصفحه‌ای روی A4 کامل
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      let heightLeft = contentHeightMM;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, WIDTH_MM, contentHeightMM);
      heightLeft -= A4_HEIGHT_MM;
      while (heightLeft > 0) {
        position = heightLeft - contentHeightMM;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, WIDTH_MM, contentHeightMM);
        heightLeft -= A4_HEIGHT_MM;
      }
      pdf.save(fileName);
    }
  } finally {
    document.body.removeChild(container);
  }
}