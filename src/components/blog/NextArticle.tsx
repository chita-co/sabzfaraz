import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogPost } from "@/types/blog";

export default function NextArticle({ post }: { post: BlogPost | null }) {
  if (!post) return null;
  return (
    <Link href={`/blog/${post.slug}`} className="blog-next-article">
      <span>بعدی را بخوانید</span>
      <h4>{post.title}</h4>
      <ArrowLeft size={18} />
    </Link>
  );
}