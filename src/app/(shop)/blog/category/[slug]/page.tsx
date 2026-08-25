import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogCategoryBySlug, getPublishedPosts } from "@/lib/blog/queries";
import BlogCard from "@/components/blog/BlogCard";
import "../../blog.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getBlogCategoryBySlug(slug);
  if (!category) return {};
  return { title: `${category.name} | مجله سبزفراز`, description: category.description ?? `مقالات دسته‌بندی ${category.name} در مجله سبزفراز` };
}

export default async function BlogCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const category = await getBlogCategoryBySlug(slug);
  if (!category) notFound();

  const { posts, total } = await getPublishedPosts({ page, pageSize: 12, categorySlug: slug });
  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="blog-page">
      <div className="blog-category-header">
        {category.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.cover_image_url} alt={category.name} />
        )}
        <div className="blog-category-header-text">
          <h1>{category.name}</h1>
          {category.description && <p>{category.description}</p>}
        </div>
      </div>
      <div className="blog-container">
        {posts.length === 0 ? (
          <p className="blog-empty">مقاله‌ای در این دسته یافت نشد.</p>
        ) : (
          <div className="blog-grid">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div>
        )}
        {totalPages > 1 && (
          <div className="blog-pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a key={p} href={`/blog/category/${slug}?page=${p}`} className={`blog-page-btn${p === page ? " active" : ""}`}>{p}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}