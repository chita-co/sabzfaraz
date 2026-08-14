export interface AuctionBidGroup {
  id: string;
  auction_id: string;
  leader_user_id: string;
  name: string;
  status: "OPEN" | "LOCKED" | "WON" | "LOST" | "PAID" | "CANCELLED";
  delivery_address_id: string | null;
  final_order_id: string | null;
  created_at: string;
}