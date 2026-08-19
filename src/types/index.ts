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
  is_sold_by_unit: boolean;
  unit_label: string | null;
  has_min_order_quantity: boolean;
  min_order_quantity: number | null
  description_images: string[];
  category_id: string;
  short_description: string | null;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  image_alt_texts: string[];
  display_priority: number;
  max_purchase_qty: number | null;
  package_length_cm: number | null;
  package_width_cm: number | null;
  package_height_cm: number | null;
  reviews_enabled: boolean;
  canonical_url: string | null;
  show_in_feed: boolean;
  gtin: string | null;
  model_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  attr_key: string;
  attr_value: string;
  sort_order: number;
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