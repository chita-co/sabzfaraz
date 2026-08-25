import BlogCard from "./BlogCard";
import { BlogPost } from "@/types/blog";

export default function RelatedPostsGrid({ posts }: { posts: BlogPost[] }) {
  return <div className="blog-related-grid">{posts.map((p) => <BlogCard key={p.id} post={p} />)}</div>;
}