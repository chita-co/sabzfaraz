"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export default function FloatingSupportButton() {
  return (
    <Link href="/support" className="floating-support-btn" aria-label="پشتیبانی">
      <LifeBuoy size={22} />
    </Link>
  );
}