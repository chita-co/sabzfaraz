"use client";

export async function renderLabelToPdf(element: HTMLElement, fileName: string) {
  const html2canvas = (await import("html2canvas-pro")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ unit: "mm", format: [100, 150] });
  pdf.addImage(imgData, "PNG", 0, 0, 100, 150);
  pdf.save(fileName);
}