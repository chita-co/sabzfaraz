// src/types/index.ts
export type UserRole = "USER" | "ADMIN";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock: number | null;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  brand: string | null;
  is_active: boolean;
  is_deal: boolean;
  show_in_newest: boolean;
  is_popular: boolean;
  sku: string;
  name_en: string | null;
  rating_avg: number;
  rating_count: number;
  weight_grams: number | null;
  is_stock: boolean;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductQuantityTier {
  id: string;
  product_id: string;
  min_qty: number;
  max_qty: number;
  unit_price: number;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}