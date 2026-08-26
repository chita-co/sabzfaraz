"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Wand2, Link as LinkIcon, X } from "lucide-react";
import BlogEditor from "./BlogEditor";
import {
  updatePostAction, createPostAction, searchProductsForArticleAction,
  resolveProductByUrlOrSlugAction, suggestCategoryForArticleAction, createCategoryAction,
} from "@/app/admin/blog/actions";

interface CategoryOption { id: string; name: string; }
interface ProductOption { id: string; name: string; price: number; slug: string; }

type BlogPostFormData = {
  id?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  main_image_url?: string;
  status?: string;
  categoryIds?: string[];
  product_id?: string;
};

export default function BlogEditForm({
  post, categories, mode,
}: {
  post?: BlogPostFormData;
  categories: CategoryOption[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [mainImage, setMainImage] = useState(post?.main_image_url ?? "");
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [categoryIds, setCategoryIds] = useState<string[]>(post?.categoryIds ?? []);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [productUrl, setProductUrl] = useState("");
  const [resolvingUrl, setResolvingUrl] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(post?.product_id ?? null);
  const [selectedProductLabel, setSelectedProductLabel] = useState<string | null>(null);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  const [isPending, startTransition] = useTransition();

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleProductSearch(q: string) {
    setProductQuery(q);
    if (q.trim().length < 2) { setProductResults([]); return; }
    setProductResults(await searchProductsForArticleAction(q));
  }

  async function handleResolveUrl() {
    if (!productUrl.trim()) return;
    setResolvingUrl(true);
    const res = await resolveProductByUrlOrSlugAction(productUrl);
    setResolvingUrl(false);
    if (res.error || !res.product) return toast.error(res.error ?? "پیدا نشد");
    setSelectedProductId(res.product.id);
    setSelectedProductLabel(res.product.name);
    setProductUrl("");
    toast.success("محصول پیدا و انتخاب شد");
  }

  async function handleSuggestCategory() {
    if (!title.trim()) return toast.error("اول عنوان مقاله را وارد کنید");
    setSuggestingCategory(true);
    const res = await suggestCategoryForArticleAction(title, excerpt);
    setSuggestingCategory(false);
    if (res.error) return toast.error(res.error);

    if (res.matchedCategoryId) {
      setCategoryIds((prev) => (prev.includes(res.matchedCategoryId!) ? prev : [...prev, res.matchedCategoryId!]));
      return toast.success(`دسته‌ی «${res.matchedCategoryName}» انتخاب شد`);
    }
    if (res.newCategoryName) {
      const confirmMsg = res.parentName
        ? `دسته‌ی جدید «${res.newCategoryName}» زیرمجموعه‌ی «${res.parentName}» پیشنهاد شد. ساخته و انتخاب شود؟`
        : `دسته‌ی جدید «${res.newCategoryName}» پیشنهاد شد. ساخته و انتخاب شود؟`;
      if (!confirm(confirmMsg)) return;
      const createRes = await createCategoryAction(res.newCategoryName, res.parentId ?? null);
      if (createRes.error || !createRes.categoryId) return toast.error(createRes.error ?? "خطا در ساخت دسته");
      setLocalCategories((prev) => [...prev, { id: createRes.categoryId!, name: res.newCategoryName! }]);
      setCategoryIds((prev) => [...prev, createRes.categoryId!]);
      toast.success("دسته ساخته و انتخاب شد");
    }
  }

  function save() {
    if (!title.trim()) return toast.error("عنوان مقاله را وارد کنید");
    const payload = { title, excerpt, content, meta_title: metaTitle, meta_description: metaDescription, tags, main_image_url: mainImage, status, categoryIds, productId: selectedProductId };
    if (mode === "edit" && !post?.id) {
      toast.error("شناسه مقاله مشخص نیست");
      return;
    }
    const editId = mode === "edit" ? post!.id : null;

    startTransition(async () => {
      const res = mode === "edit" ? await updatePostAction(editId as string, payload) : await createPostAction(payload);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("ذخیره شد");
      if (mode === "create" && "postId" in res && res.postId) router.push(`/admin/blog/${res.postId}`);
    });
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{mode === "edit" ? "ویرایش مقاله" : "افزودن مقاله دستی"}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان" />
        <textarea className="admin-input" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="خلاصه" />

        <BlogEditor value={content} onChange={setContent} />

        <input className="admin-input" value={mainImage} onChange={(e) => setMainImage(e.target.value)} placeholder="آدرس تصویر کاور (یا داخل ادیتور آپلود کن و لینکش رو اینجا بچسبون)" />
        <input className="admin-input" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="عنوان سئو" />
        <textarea className="admin-input" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} placeholder="توضیح متا" />
        <input className="admin-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="برچسب‌ها (با کاما جدا کنید)" />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>دسته‌بندی‌ها</label>
            <button type="button" onClick={handleSuggestCategory} disabled={suggestingCategory} className="admin-btn" style={{ padding: "4px 10px", fontSize: 11.5, display: "flex", alignItems: "center", gap: 4 }}>
              <Wand2 size={13} /> {suggestingCategory ? "در حال تشخیص..." : "پیشنهاد دسته‌بندی با هوش مصنوعی"}
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {localCategories.map((c) => (
              <button key={c.id} type="button" onClick={() => toggleCategory(c.id)} className={`blog-cat-pill${categoryIds.includes(c.id) ? " blog-cat-pill-active" : ""}`} style={{ cursor: "pointer", border: "none" }}>
                {c.name}
              </button>
            ))}
            {localCategories.length === 0 && <span style={{ fontSize: 12, color: "#9ca3af" }}>هنوز دسته‌بندی‌ای نساختید — از دکمه‌ی بالا یا صفحه‌ی دسته‌بندی‌ها بسازید.</span>}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>لینک محصول (اختیاری — باکس خرید در انتهای مقاله نشون داده می‌شه)</label>
          {selectedProductId ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "8px 12px" }}>
              <span style={{ fontSize: 13 }}>{selectedProductLabel ?? "محصول انتخاب شد"}</span>
              <button type="button" onClick={() => { setSelectedProductId(null); setSelectedProductLabel(null); }}><X size={16} /></button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <input className="admin-input" value={productQuery} onChange={(e) => handleProductSearch(e.target.value)} placeholder="جستجوی محصول با نام..." />
                {productResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", right: 0, left: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginTop: 4, zIndex: 10, maxHeight: 220, overflowY: "auto" }}>
                    {productResults.map((p) => (
                      <button key={p.id} type="button" onClick={() => { setSelectedProductId(p.id); setSelectedProductLabel(p.name); setProductResults([]); setProductQuery(""); }} style={{ display: "block", width: "100%", textAlign: "right", padding: "8px 12px", fontSize: 13, border: "none", background: "transparent", cursor: "pointer" }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="admin-input" style={{ flex: 1 }} value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="یا لینک محصول را بچسبانید (مثلاً sabzfaraz.ir/products/xyz)" dir="ltr" />
                <button type="button" className="admin-btn" disabled={resolvingUrl} onClick={handleResolveUrl} style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <LinkIcon size={14} /> {resolvingUrl ? "..." : "اتصال"}
                </button>
              </div>
            </div>
          )}
        </div>

        <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">پیش‌نویس</option>
          <option value="pending_review">در انتظار بررسی</option>
          <option value="published">منتشرشده</option>
          <option value="rejected">رد شده</option>
        </select>

        <button className="admin-btn admin-btn-primary" disabled={isPending} onClick={save} style={{ alignSelf: "flex-start", padding: "10px 26px" }}>
          {isPending ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>
    </div>
  );
}