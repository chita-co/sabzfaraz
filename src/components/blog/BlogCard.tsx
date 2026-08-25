import Link from "next/link";
import { BlogPost } from "@/types/blog";

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      <div className="blog-card-image">
        {post.main_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.main_image_url} alt={post.title} loading="lazy" />
        ) : (
          <div className="blog-card-image-placeholder" />
        )}
      </div>
      <div className="blog-card-body">
        <h3 className="blog-card-title">{post.title}</h3>
        {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
        <div className="blog-card-meta">
          {post.read_time && <span>{post.read_time} دقیقه مطالعه</span>}
          <span>{(post.view_count ?? 0).toLocaleString("fa-IR")} بازدید</span>
        </div>
      </div>
    </Link>
  );
}