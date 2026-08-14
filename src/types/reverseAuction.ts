export interface ReverseAuction {
  id: string;
  title: string;
  description: string;
  images: string[];
  category_id: string | null;
  product_id: string | null;
  starting_price: number;
  floor_price: number;
  drop_amount: number;
  drop_interval_minutes: number;
  shipping_cost: number;
  starts_at: string;
  ends_at: string | null;
  rules_text: string | null;
  status: "UPCOMING" | "ACTIVE" | "SOLD" | "ENDED_UNSOLD" | "CANCELLED";
  winner_user_id: string | null;
  sold_price: number | null;
  sold_at: string | null;
  payment_deadline: string | null;
  payment_status: "PENDING" | "PAID" | "EXPIRED" | null;
  final_order_id: string | null;
  created_at: string;
}