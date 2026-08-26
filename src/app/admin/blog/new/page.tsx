import { getBlogCategories } from "@/lib/blog/queries";
import BlogEditForm from "@/components/admin/blog/BlogEditForm";

export default async function AdminBlogNewPage() {
  const categories = await getBlogCategories();
  return <BlogEditForm categories={categories} mode="create" />;
}