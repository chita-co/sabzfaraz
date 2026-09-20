"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/lib/wishlist";
import { createClient } from "@/lib/supabase/client";

export default function WishlistButton({
  productId,
  initialWishlisted,
  size = 18,
}: {
  productId: string;
  initialWishlisted: boolean;
  size?: number;
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [animating, setAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let ignore = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (!ignore && data) setWishlisted(true);
    })();
    return () => { ignore = true; };
  }, [productId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    const result = await toggleWishlist(productId);
    setAnimating(false);
    if (result?.needsLogin) {
      router.push("/login");
      return;
    }
    setWishlisted(!!result?.added);
  }

  return (
    <button
      onClick={handleClick}
      className={`wishlist-btn${wishlisted ? " active" : ""}${animating ? " beat" : ""}`}
      aria-label="افزودن به علاقه‌مندی‌ها"
    >
      <Heart size={size} fill={wishlisted ? "#ef4444" : "none"} />
    </button>
  );
}