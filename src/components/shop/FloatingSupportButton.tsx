"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import SupportUnreadBadgeUser from "./SupportUnreadBadgeUser";

export default function FloatingSupportButton() {
  return (
    <Link href="/support" className="floating-support-btn" aria-label="پشتیبانی" style={{ position: "relative" }}>
      <LifeBuoy size={22} />
      <SupportUnreadBadgeUser />
    </Link>
  );
}