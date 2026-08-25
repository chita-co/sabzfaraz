"use client";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import BlogEditor from "./BlogEditor";
import { updatePostAction } from "@/app/admin/blog/actions";

interface BlogEditPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  main_image_url: string | null;
  status: string;
}

export default function BlogEditForm({ post }: { post: BlogEditPost }) {
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [content, setContent] = useState(post.content ?? "");
  const [metaTitle, setMetaTitle] = useState(post.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post.meta_description ?? "");
  const [tags, setTags] = useState((post.tags ?? []).join(", "));
  const [mainImage, setMainImage] = useState(post.main_image_url ?? "");
  const [status, setStatus] = useState(post.status);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await updatePostAction(post.id, { title, excerpt, content, meta_title: metaTitle, meta_description: metaDescription, tags, main_image_url: mainImage, status });
      if (res.error) toast.error(res.error);
      else toast.success("ذخیره شد");
    });
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>ویرایش مقاله</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان" />
        <textarea className="admin-input" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="خلاصه" />

        <BlogEditor value={content} onChange={setContent} />

        <input className="admin-input" value={mainImage} onChange={(e) => setMainImage(e.target.value)} placeholder="آدرس تصویر کاور" />
        <input className="admin-input" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="عنوان سئو" />
        <textarea className="admin-input" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} placeholder="توضیح متا" />
        <input className="admin-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="برچسب‌ها (با کاما جدا کنید)" />

        <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">پیش‌نویس</option>
          <option value="pending_review">در انتظار بررسی</option>
          <option value="published">منتشرشده</option>
          <option value="rejected">رد شده</option>
        </select>

        <button className="admin-btn admin-btn-primary" disabled={isPending} onClick={save} style={{ alignSelf: "flex-start", padding: "10px 26px" }}>
          {isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </div>
  );
}