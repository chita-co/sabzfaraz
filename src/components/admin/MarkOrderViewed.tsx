"use client";
import { useEffect } from "react";
import { markOrderViewedAction } from "@/app/admin/orders/actions";

export default function MarkOrderViewed({ orderId }: { orderId: string }) {
  useEffect(() => { markOrderViewedAction(orderId).catch(() => {}); }, [orderId]);
  return null;
}