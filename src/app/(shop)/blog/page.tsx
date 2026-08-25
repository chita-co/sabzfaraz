import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, getFeaturedPosts, getBlogCategories } from "@/lib/blog/queries";
import InfiniteBlogList from "@/components/blog/InfiniteBlogList";
import BlogHero from "@/components/blog/BlogHero";
import "./blog.css";

export const metadata: Metadata = {
  title: "مجله سبزفراز | راهنمای خرید، آموزش و اخبار لوازم الکترونیک",
  description: "مجله سبزفراز؛ راهنمای خرید، بررسی تخصصی، آموزش و اخبار لوازم الکترونیک با تولید محتوای هوشمند و به‌روز.",
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ posts, total }, featured, categories] = await Promise.all([
    getPublishedPosts({ page, pageSize: 12, search: q }),
    page === 1 && !q ? getFeaturedPosts(5) : Promise.resolve([]),
    getBlogCategories(),
  ]);

  return (
    <div className="blog-page">
      {featured.length > 0 && <BlogHero posts={featured} />}
      <div className="blog-container">
        <div className="blog-categories-bar">
          <Link href="/blog" className="blog-cat-pill blog-cat-pill-active">همه</Link>
          {categories.map((c) => <Link key={c.id} href={`/blog/category/${c.slug}`} className="blog-cat-pill">{c.name}</Link>)}
        </div>

        <form className="blog-search-bar" action="/blog" method="GET">
          <input type="text" name="q" defaultValue={q ?? ""} placeholder="جستجو در مقالات..." />
          <button type="submit">جستجو</button>
        </form>

        {posts.length === 0 ? (
          <p className="blog-empty">مقاله‌ای یافت نشد.</p>
        ) : (
          <InfiniteBlogList initialPosts={posts} total={total} search={q} />
        )}
      </div>
    </div>
  );
}