export type BlogPostStatus = "draft" | "pending_review" | "published" | "rejected";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  parent_id: string | null;
  status: "active" | "pending";
  created_at: string;
}

export interface BlogPostProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  discount_price: number | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  main_image_url: string | null;
  product_id: string | null;
  status: BlogPostStatus;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  read_time: number | null;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  is_featured: boolean;
  ai_generated: boolean;
  pending_category_name: string | null;
  created_at: string;
  published_at: string | null;
  categories?: BlogCategory[];
  product?: BlogPostProduct | null;
}