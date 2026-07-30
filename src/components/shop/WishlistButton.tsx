"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/lib/wishlist";

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