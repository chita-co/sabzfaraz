import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrdersListClient from "@/components/shop/OrdersListClient";
import ProductReviewsSection from "@/components/shop/ProductReviewsSection";
import Breadcrumb from "@/components/shop/Breadcrumb";
import HyperspeedBackground from "@/components/backgrounds/HyperspeedBackground";

type TrackingSettings = {
  tracking_stage_1: string;
  tracking_stage_2: string;
  tracking_stage_3: string;
  tracking_stage_4: string;
  tracking_stage_5: string;
};

type PaidOrder = {
  items: {
    product_id: string;
    product_name: string;
    product_image: string;
  }[];
};

type MyReview = {
  product_id: string;
  rating: number;
  comment: string | null;
};

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: orders }, { data: settings }, { data: profile }, { data: paidOrders }, { data: myReviews }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("site_settings")
        .select(
          "tracking_stage_1, tracking_stage_2, tracking_stage_3, tracking_stage_4, tracking_stage_5"
        )
        .eq("id", 1)
        .single(),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase
        .from("orders")
        .select("items:order_items(product_id, product_name, product_image)")
        .eq("user_id", user.id)
        .eq("payment_status", "PAID"),
      supabase
        .from("product_reviews")
        .select("product_id, rating, comment")
        .eq("user_id", user.id),
    ]);

  const purchasedMap = new Map<string, { name: string; image: string }>();
  (paidOrders as PaidOrder[] ?? []).forEach((o) => {
    (o.items ?? []).forEach((i) => {
      if (!purchasedMap.has(i.product_id)) {
        purchasedMap.set(i.product_id, {
          name: i.product_name,
          image: i.product_image,
        });
      }
    });
  });

  const reviewsByProduct = new Map(
    (myReviews as MyReview[] ?? []).map((r) => [r.product_id, r])
  );

  const productsForReview = Array.from(purchasedMap.entries()).map(
    ([productId, v]) => ({
      productId,
      name: v.name,
      image: v.image,
      existingReview: reviewsByProduct.get(productId) ?? null,
    })
  );

  const trackingSettings: TrackingSettings = settings ?? {
    tracking_stage_1: "",
    tracking_stage_2: "",
    tracking_stage_3: "",
    tracking_stage_4: "",
    tracking_stage_5: "",
  };

  return (
    <>
      <HyperspeedBackground />
      <div className="mx-auto max-w-3xl px-4 py-10 relative z-10">
        <Breadcrumb theme="dark" items={[{ label: "پروفایل من", href: "/profile" }, { label: "سفارشات من" }]} />

        <h1 className="text-xl font-bold text-white mb-6">سفارشات من</h1>

        <a href="/profile/loyalty" className="profile-orders-banner mb-6">
          <div className="profile-orders-icon" style={{ background: "#f59e0b" }}>🎁</div>
          <div>
            <p className="profile-orders-title">باشگاه مشتریان</p>
            <p className="profile-orders-subtitle">امتیاز و سطح عضویتت رو ببین</p>
          </div>
        </a>

        <ProductReviewsSection
          products={productsForReview}
          defaultReviewerName={profile?.full_name ?? ""}
        />

        <OrdersListClient
          orders={orders ?? []}
          trackingSettings={trackingSettings}
        />
      </div>
    </>
  );
}