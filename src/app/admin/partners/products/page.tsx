import { createAdminClient } from "@/lib/supabase/admin";
import { approvePartnerProductAction, rejectPartnerProductAction } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPartnerProductsQueuePage() {
  const admin = createAdminClient();
  const { data: products } = await admin
  .from("products")
  .select("id, name, description, price, partner_cost_price, stock, images, category:categories(name), partner:partners(business_name, phone), partner_approval_status, is_active")
  .not("partner_id", "is", null)
  .order("created_at", { ascending: true });

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>محصولات همکاران در انتظار بررسی</h1>
      <div className="admin-card">
        {(!products || products.length === 0) ? (
          <p className="text-gray-500 text-sm text-center py-6">محصولی در صف بررسی نیست.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {products.map((p: {
              id: string;
              name: string;
              description: string;
              price: number;
              partner_cost_price: number | null;
              stock: number;
              images: string[];
              category: { name: string } | { name: string }[] | null;
              partner: { business_name: string | null; phone: string | null } | { business_name: string | null; phone: string | null }[] | null;
            }) => {
              const profit = p.price - (p.partner_cost_price ?? 0);
              const profitPercent = p.price > 0 ? ((profit / p.price) * 100).toFixed(1) : "0";
              const category = Array.isArray(p.category) ? p.category[0] : p.category;
              const partner = Array.isArray(p.partner) ? p.partner[0] : p.partner;
              return (
                <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, display: "flex", gap: 14 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.images?.[0] && <img src={p.images[0]} alt={p.name} style={{ width: 90, height: 90, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800 }}>{p.name}</p>
                     <p style={{ fontSize: 12, color: "#6b7280" }}>همکار: {partner?.business_name} — {partner?.phone}</p>
                    <p style={{ fontSize: 12, color: "#6b7280" }}>دسته: {category?.name ?? "—"}</p>
                    <p style={{ fontSize: 12 }}>فروش: {p.price.toLocaleString("fa-IR")} تومان — دریافتی همکار: {(p.partner_cost_price ?? 0).toLocaleString("fa-IR")} تومان — سود سایت: {profitPercent}٪</p>
                    <p style={{ fontSize: 12 }}>موجودی: {p.stock.toLocaleString("fa-IR")}</p>
                    <div dangerouslySetInnerHTML={{ __html: p.description }} style={{ fontSize: 12, color: "#4b5563", marginTop: 6, maxHeight: 80, overflow: "hidden" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Link href={`/admin/products/${p.id}/edit`} className="admin-btn admin-btn-secondary" style={{ textAlign: "center" }}>ویرایش کامل</Link>
                    <form action={async () => { "use server"; await approvePartnerProductAction(p.id); }}>
                      <button className="admin-btn admin-btn-primary" style={{ width: "100%" }}>تأیید و انتشار</button>
                    </form>
                    <RejectForm productId={p.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RejectForm({ productId }: { productId: string }) {
  async function reject(formData: FormData) {
    "use server";
    const reason = String(formData.get("reason") || "توضیحات ناقص");
    await rejectPartnerProductAction(productId, reason);
  }
  return (
    <form action={reject} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <select name="reason" className="admin-input" style={{ fontSize: 11 }}>
        <option value="کیفیت تصویر نامناسب">کیفیت تصویر نامناسب</option>
        <option value="قیمت نامناسب">قیمت نامناسب</option>
        <option value="توضیحات ناقص">توضیحات ناقص</option>
        <option value="دسته‌بندی اشتباه">دسته‌بندی اشتباه</option>
        <option value="مغایرت با قوانین">مغایرت با قوانین</option>
      </select>
      <button className="admin-btn admin-btn-danger">رد محصول</button>
    </form>
  );
}