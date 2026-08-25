import Link from "next/link";
import { BlogPost } from "@/types/blog";

export default function RelatedArticlesForProduct({ posts }: { posts: BlogPost[] }) {
  if (!posts || posts.length === 0) return null;
  return (
    <div className="product-description" style={{ marginTop: 8 }}>
      <h3 className="product-section-title">راهنمای خرید و مقالات مرتبط</h3>
      <div className="product-blog-cards">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="product-blog-card">
            {post.main_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.main_image_url} alt={post.title} />
            )}
            <div>
              <span>{post.title}</span>
              {post.excerpt && <p>{post.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}