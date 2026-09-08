"use client";

import Link from "next/link";
import SupportUnreadBadgeUser from "./SupportUnreadBadgeUser";

export default function FloatingSupportButton() {
  return (
    <div className="floating-support-wrap">
      <Link href="/support" className="floating-support-btn" aria-label="پشتیبانی" >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/p-icon.png"
          alt="پشتیبانی"
          style={{
            width: "165%",
            height: "165%",
            objectFit: "cover",
            objectPosition: "center 25%",
            display: "block",
          }}
        />
      </Link>
      <SupportUnreadBadgeUser />
    </div>
  );
}