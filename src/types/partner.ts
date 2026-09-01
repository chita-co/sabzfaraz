export type PartnerStatus = "PENDING_REVIEW" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "BLOCKED";
export type PartnerProductApproval = "NOT_APPLICABLE" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type PartnerFulfillmentStatus = "PENDING" | "PREPARING" | "READY_FOR_PICKUP" | "PICKED_UP" | "CANCELLED";

export interface Partner {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string;
  email: string | null;
  national_id: string | null;
  address: string;
  logo_url: string | null;
  bio: string | null;
  sheba_number: string | null;
  card_number: string | null;
  status: PartnerStatus;
  rejection_reason: string | null;
  rating_avg: number;
  wallet_pending_balance: number;
  wallet_available_balance: number;
  reserve_balance: number;
  stock_out_violation_count: number;
  max_active_products: number | null;
  max_active_orders: number | null;
  ai_daily_request_limit: number | null;
  approved_at: string | null;
  created_at: string;
}

export interface PartnerCategoryOption {
  id: string;
  name: string;
}

export interface PartnerSettings {
  min_profit_percent: number;
  min_allowed_stock: number;
  settlement_hold_days: number;
  reserve_balance_amount: number;
  min_withdrawal_amount: number;
  registration_open: boolean;
  ai_rotation_mode: "SEQUENTIAL" | "RANDOM";
  ai_default_prompt: string;
  low_stock_threshold: number;
  partner_terms_text: string;
  frame_template_url: string | null;
  frame_center_x: number;
  frame_center_y: number;
  frame_center_width: number;
  frame_center_height: number;
  frame_output_size: number;
}