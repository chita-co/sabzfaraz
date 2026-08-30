import BulkExcelUpload from "@/components/partner/BulkExcelUpload";

export default function BulkUploadPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>افزودن گروهی محصولات</h1>
      <BulkExcelUpload />
    </div>
  );
}