export interface Auction {
  id: string;
  title: string;
  description: string;
  images: string[];
  category_id: string | null;
  product_id: string | null;
  base_price: number;
  min_increment: number;
  reserve_price: number | null;
  max_price: number | null;
  entry_fee: number;
  entry_fee_refundable: boolean;
  max_participants: number | null;
  max_bids_per_user: number | null;
  shipping_cost: number;
  starts_at: string;
  ends_at: string;
  auto_extend_enabled: boolean;
  auto_extend_trigger_minutes: number;
  auto_extend_by_minutes: number;
  max_extensions: number | null;
  extension_count: number;
  rules_text: string | null;
  bots_enabled: boolean;
  status: "UPCOMING" | "ACTIVE" | "ENDED" | "WINNER_DETERMINED" | "CANCELLED" | "FAILED_NO_WINNER";
  winner_user_id: string | null;
  winner_bid_amount: number | null;
  winner_payment_deadline: string | null;
  winner_payment_status: "PENDING" | "PAID" | "EXPIRED" | null;
  final_order_id: string | null;
  final_payment_hours: number;
  created_at: string;
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  user_id: string | null;
  is_bot: boolean;
  bot_name: string | null;
  amount: number;
  created_at: string;
}