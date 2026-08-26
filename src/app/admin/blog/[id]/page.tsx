import { notFound } from "next/navigation";
import { getPostForEditAction } from "../actions";
import { getBlogCategories } from "@/lib/blog/queries";
import BlogEditForm from "@/components/admin/blog/BlogEditForm";

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories] = await Promise.all([getPostForEditAction(id), getBlogCategories()]);
  if (!post) notFound();
  return <BlogEditForm post={post} categories={categories} mode="edit" />;
}