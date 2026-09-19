"use client";

import { useEffect } from "react";

export default function BlogViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    }).catch(() => {});
  }, [postId]);
  return null;
}