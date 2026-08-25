"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { BlogPost } from "@/types/blog";

export default function BlogHero({ posts }: { posts: BlogPost[] }) {
  const main = posts[0];
  const rest = posts.slice(1, 4);
  if (!main) return null;

  return (
    <div className="blog-hero">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="blog-hero-main">
        <Link href={`/blog/${main.slug}`}>
          {main.main_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={main.main_image_url} alt={main.title} />
          )}
          <div className="blog-hero-overlay">
            <span className="blog-hero-badge">مقاله ویژه</span>
            <h1>{main.title}</h1>
            {main.excerpt && <p>{main.excerpt}</p>}
          </div>
        </Link>
      </motion.div>

      {rest.length > 0 && (
        <div className="blog-hero-side">
          {rest.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}>
              <Link href={`/blog/${p.slug}`} className="blog-hero-side-item">
                {p.main_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.main_image_url} alt={p.title} />
                )}
                <span>{p.title}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}