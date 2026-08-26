"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { searchProductsForArticleAction, generateArticleFromTopicAction } from "@/app/admin/blog/actions";

interface ProductOption { id: string; name: string; price: number; slug: string; }

export default function BlogSuggestForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [briefing, setBriefing] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleProductSearch(q: string) {
    setProductQuery(q);
    if (q.trim().length < 2) { setProductResults([]); return; }
    setProductResults(await searchProductsForArticleAction(q));
  }

  function submit() {
    if (!topic.trim()) return toast.error("موضوع مقاله را وارد کنید");
    startTransition(async () => {
      const res = await generateArticleFromTopicAction(topic, briefing, selectedProduct?.id ?? null);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("مقاله ساخته شد، در حال انتقال به صفحه ویرایش...");
      if (res.postId) router.push(`/admin/blog/${res.postId}`);
    });
  }

  return (
    <div className="admin-card" style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>موضوع مقاله</label>
        <input className="admin-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثلاً: بررسی و مقایسه ماینرهای قدیمی (اس فایو) با راهکارهای جدید" />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>توضیح تکمیلی (اختیاری)</label>
        <textarea className="admin-input" value={briefing} onChange={(e) => setBriefing(e.target.value)} rows={4} placeholder="مثلاً: توضیح بده که مدل‌های قدیمی چرا دیگه به‌صرفه نیستن، سرعت هش و مصرف برق و..." />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>معرفی محصول در پایان مقاله (اختیاری)</label>
        {selectedProduct ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "8px 12px" }}>
            <span style={{ fontSize: 13 }}>{selectedProduct.name}</span>
            <button onClick={() => setSelectedProduct(null)}><X size={16} /></button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <input className="admin-input" value={productQuery} onChange={(e) => handleProductSearch(e.target.value)} placeholder="جستجوی محصول برای معرفی در انتهای مقاله..." />
            {productResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", right: 0, left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginTop: 4, zIndex: 10, maxHeight: 220, overflowY: "auto" }}>
                {productResults.map((p) => (
                  <button key={p.id} onClick={() => { setSelectedProduct(p); setProductResults([]); setProductQuery(""); }} style={{ display: "block", width: "100%", textAlign: "right", padding: "8px 12px", fontSize: 13, border: "none", background: "transparent", cursor: "pointer" }}>
                    {p.name} — {p.price.toLocaleString("fa-IR")} تومان
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 4 }}>اگه محصولی انتخاب نکنی، مقاله فقط آموزشی/توضیحی می‌مونه و به هیچ محصولی لینک نمی‌شه.</p>
      </div>

      <button className="admin-btn admin-btn-primary" disabled={isPending} onClick={submit} style={{ alignSelf: "flex-start", padding: "10px 26px" }}>
        {isPending ? "در حال نوشتن مقاله..." : "تولید مقاله با هوش مصنوعی"}
      </button>
    </div>
  );
}