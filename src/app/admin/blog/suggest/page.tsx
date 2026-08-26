import BlogSuggestForm from "@/components/admin/blog/BlogSuggestForm";

export default function AdminBlogSuggestPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>پیشنهاد موضوع مقاله به ربات</h1>
      <BlogSuggestForm />
    </div>
  );
}