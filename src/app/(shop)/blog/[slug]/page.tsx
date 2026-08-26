import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPostBySlug, getRelatedPosts, incrementPostView, getCommentsForPost } from "@/lib/blog/queries";
import ArticleBody from "@/components/blog/ArticleBody";
import ProductCtaBox from "@/components/blog/ProductCtaBox";
import RelatedPostsGrid from "@/components/blog/RelatedPostsGrid";
import ArticleReactions from "@/components/blog/ArticleReactions";
import ReadingProgressBar from "@/components/blog/ReadingProgressBar";
import TableOfContents from "@/components/blog/TableOfContents";
import ArticleImageLightbox from "@/components/blog/ArticleImageLightbox";
import CommentsSection from "@/components/blog/CommentsSection";
import NextArticle from "@/components/blog/NextArticle";
import UserBadgesWidget from "@/components/blog/UserBadgesWidget";
import "../blog.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      images: post.main_image_url ? [post.main_image_url] : undefined,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  incrementPostView(post.id).catch(() => {});

  const supabase = await createClient();
  const [related, comments, { data: { user } }] = await Promise.all([
    getRelatedPosts(post.id, 6),
    getCommentsForPost(post.id),
    supabase.auth.getUser(),
  ]);
  const isLoggedIn = !!user;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    image: post.main_image_url ? [post.main_image_url] : undefined,
    datePublished: post.published_at,
    author: { "@type": "Organization", name: "سبزفراز" },
  };

  return (
    <article className="blog-article">
      <ReadingProgressBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="blog-article-hero">
        {post.main_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.main_image_url} alt={post.title} />
        )}
        <div className="blog-article-hero-overlay">
          <nav className="blog-breadcrumb">
            <Link href="/blog">مجله</Link>
            {post.categories?.[0] && <> / <Link href={`/blog/category/${post.categories[0].slug}`}>{post.categories[0].name}</Link></>}
          </nav>
          <h1>{post.title}</h1>
          <div className="blog-article-meta">
            {post.read_time && <span>{post.read_time} دقیقه مطالعه</span>}
            <span>{(post.view_count ?? 0).toLocaleString("fa-IR")} بازدید</span>
          </div>
        </div>
      </div>

      <div className="blog-article-layout">
        <TableOfContents />
        <div className="blog-article-body-wrap">
          <ArticleBody content={post.content} ctaComponent={<ProductCtaBox product={post.product ?? null} />} />
          <ArticleImageLightbox />
          <ArticleReactions postId={post.id} initialLikes={post.like_count} initialBookmarks={post.bookmark_count} isLoggedIn={isLoggedIn} />
          <UserBadgesWidget postId={post.id} />
          {post.product && <div className="blog-article-bottom-cta"><ProductCtaBox product={post.product} /></div>}
          {related.length > 0 && <NextArticle post={related[0]} />}
          {related.length > 0 && (
            <section className="blog-related">
              <h2>مقالات مرتبط</h2>
              <RelatedPostsGrid posts={related} />
            </section>
          )}
          <CommentsSection postId={post.id} initialComments={comments} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </article>
  );
}