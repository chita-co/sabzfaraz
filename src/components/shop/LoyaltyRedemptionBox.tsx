"use client";

import { useState, useEffect } from "react";
import { Coins, Gift } from "lucide-react";
import { getLoyaltyPreview } from "@/app/(shop)/checkout/loyalty-actions";

export default function LoyaltyRedemptionBox({
  subtotal,
  onChange,
}: {
  subtotal: number;
  onChange: (points: number, discountAmount: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [maxRedeemable, setMaxRedeemable] = useState(0);
  const [pointValueToman, setPointValueToman] = useState(100);
  const [minOrder, setMinOrder] = useState(0);
  const [pointsToEarn, setPointsToEarn] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    getLoyaltyPreview(subtotal).then((data) => {
      setBalance(data.balance);
      setMaxRedeemable(data.maxRedeemable);
      setPointValueToman(data.pointValueToman);
      setMinOrder(data.minOrderForRedemption);
      setPointsToEarn(data.pointsToEarn);
      setLoading(false);
    });
  }, [subtotal]);

  function handleSlide(value: number) {
    setPoints(value);
    onChange(value, value * pointValueToman);
  }

  if (loading) return null;

  return (
    <div className="loyalty-box-wrap">
      {pointsToEarn > 0 && (
        <div className="loyalty-earn-preview">
          <Gift size={16} className="text-amber-500" />
          <span>با نهایی کردن این سفارش، <b>{pointsToEarn.toLocaleString("fa-IR")} امتیاز</b> به حسابت اضافه می‌شه.</span>
        </div>
      )}

      {balance > 0 && (
        subtotal < minOrder ? (
          <div className="loyalty-redeem-box loyalty-redeem-disabled">
            <Coins size={16} />
            <span>برای استفاده از {balance.toLocaleString("fa-IR")} امتیازت، حداقل باید {minOrder.toLocaleString("fa-IR")} تومان خرید کنی.</span>
          </div>
        ) : (
          <div className="loyalty-redeem-box">
            <div className="loyalty-redeem-header">
              <Coins size={18} className="text-amber-500" />
              <span>موجودی امتیاز شما: <b>{balance.toLocaleString("fa-IR")}</b></span>
            </div>
            <input
              type="range" min={0} max={maxRedeemable} value={points}
              onChange={(e) => handleSlide(Number(e.target.value))}
              className="loyalty-slider"
            />
            <div className="loyalty-redeem-footer">
              <span>{points.toLocaleString("fa-IR")} امتیاز مصرف می‌شود</span>
              <span className="loyalty-discount-amount">{(points * pointValueToman).toLocaleString("fa-IR")} تومان تخفیف</span>
            </div>
            {points > 0 && (
              <p className="loyalty-redeem-hint">با مصرف {points.toLocaleString("fa-IR")} امتیاز، {(points * pointValueToman).toLocaleString("fa-IR")} تومان تو جیبت می‌مونه! 🎉</p>
            )}
          </div>
        )
      )}
    </div>
  );
}