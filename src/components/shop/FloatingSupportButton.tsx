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
        style={{
          width: "155%",
          height: "155%",
          objectFit: "cover",
          objectPosition: "center 35%",
          display: "block",
        }}
      />
      <SupportUnreadBadgeUser />
    </Link>
  );
}