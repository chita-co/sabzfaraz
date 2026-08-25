import { notFound } from "next/navigation";
import { getPostForEditAction } from "../actions";
import BlogEditForm from "@/components/admin/blog/BlogEditForm";

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostForEditAction(id);
  if (!post) notFound();
  return <BlogEditForm post={post} />;
}