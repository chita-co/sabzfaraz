"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deletePartnerProductAction } from "@/app/partner/products/actions";

export default function PartnerProductDeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("آیا از حذف این محصول مطمئن هستید؟ این عملیات غیرقابل بازگشت است.")) return;
    setLoading(true);
    const res = await deletePartnerProductAction(productId);
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("محصول حذف شد.");
    router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className="partner-btn" style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
      <Trash2 size={13} /> {loading ? "..." : "حذف"}
    </button>
  );
}