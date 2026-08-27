"use client";

import Link from "next/link";
import SupportUnreadBadgeUser from "./SupportUnreadBadgeUser";

export default function FloatingSupportButton() {
  return (
    <Link href="/support" className="floating-support-btn" aria-label="پشتیبانی" >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/p-icon.png"
        alt="پشتیبانی"
        width={48}
        height={48}
        style={{ objectFit: "contain", borderRadius: "50%" }}
      />
      <SupportUnreadBadgeUser />
    </Link>
  );
}