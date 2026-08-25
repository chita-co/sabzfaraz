"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import BlogCard from "./BlogCard";
import { BlogPost } from "@/types/blog";

export default function InfiniteBlogList({
  initialPosts, total, pageSize = 12, categorySlug, search,
}: { initialPosts: BlogPost[]; total: number; pageSize?: number; categorySlug?: string; search?: string }) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = posts.length < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({ page: String(nextPage), pageSize: String(pageSize) });
    if (categorySlug) params.set("category", categorySlug);
    if (search) params.set("q", search);
    const res = await fetch(`/api/blog/posts?${params.toString()}`);
    const data = await res.json();
    setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    setPage(nextPage);
    setLoading(false);
  }, [loading, hasMore, page, pageSize, categorySlug, search]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: "400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="blog-grid">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div>
      {hasMore && <div ref={sentinelRef} className="blog-infinite-sentinel">{loading && <span className="blog-loading-spinner" />}</div>}
      {!hasMore && posts.length > pageSize && <p className="blog-end-message">به انتهای مقالات رسیدید 🌿</p>}
    </>
  );
}