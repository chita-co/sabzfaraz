"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Award } from "lucide-react";
import { logViewActivityAction } from "@/app/(shop)/blog/actions";

export default function UserBadgesWidget({ postId }: { postId: string }) {
  const [badgeCount, setBadgeCount] = useState<number | null>(null);

  useEffect(() => {
    logViewActivityAction(postId).then((res) => {
      const newCount = res.earnedBadges.length;
      const prevCount = Number(sessionStorage.getItem("blog_badge_count") ?? "0");
      if (newCount > prevCount) {
        const newest = res.earnedBadges[res.earnedBadges.length - 1] as { blog_badges?: { title?: string } } | undefined;
        toast.success(`نشان جدید گرفتید: ${newest?.blog_badges?.title ?? "🏅"}`, { icon: "🏅", duration: 5000 });
      }
      sessionStorage.setItem("blog_badge_count", String(newCount));
      setBadgeCount(newCount);
    });
  }, [postId]);

  if (badgeCount === null) return null;
  return (
    <div className="blog-badge-mini">
      <Award size={14} /> {badgeCount.toLocaleString("fa-IR")} نشان کسب‌شده
    </div>
  );
}