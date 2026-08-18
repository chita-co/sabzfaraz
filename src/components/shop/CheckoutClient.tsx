"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { useCartStore, useCartWeight } from "@/store/cart-store";
import { createOrderAndPay, createOfflineOrder } from "@/app/(shop)/checkout/actions";
import ProformaInvoiceButton from "./ProformaInvoiceButton";
import LoyaltyRedemptionBox from "./LoyaltyRedemptionBox";
import DiscountCodeBox from "./DiscountCodeBox";
import PaymentMethodSelector, { type PaymentMethod } from "./PaymentMethodSelector";
import type { BankAccountInfo } from "./BankAccountDisplay";
import { CartItem } from "@/store/cart-store";

interface AddressRow {
  id: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  postal_code: string;
  address_line: string;
}
interface ShippingMethod {
  id: string;
  name: string;
}
interface ShippingTier {
  id: string;
  method_id: string;
  min_weight_grams: number;
  max_weight_grams: number;
  cost: number;
}
interface PendingCheckout {
  id: string;
  items: CartItem[];
  shipping_cost: number;
  expires_at: string;
}

export default function CheckoutClient({
  addresses,
  shippingMethods,
  shippingTiers,
  storeInfo,
  pendingCheckout,
  itemsToRestore,
  bankAccounts,
  walletBalance = 0,
}: {
  addresses: AddressRow[];
  shippingMethods: ShippingMethod[];
  shippingTiers: ShippingTier[];
  storeInfo: {
    name: string;
    phones: string[];
    address: string;
    logoUrl: string | null;
    email?: string | null;
  };
  pendingCheckout?: PendingCheckout | null;
  itemsToRestore?: CartItem[] | null;
  bankAccounts: BankAccountInfo[];
  walletBalance?: number;
}) {
  const items = useCartStore((s) => s.items);
  const cartWeightGrams = useCartWeight();
  const restoreGate = useRef(false);

  const [pendingOfflineMethod, setPendingOfflineMethod] =
    useState<PaymentMethod | null>(null);

  const [selectedAddress, setSelectedAddress] = useState(
    addresses[0]?.id ?? ""
  );
  const [selectedMethodId, setSelectedMethodId] = useState(
    shippingMethods[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [discountCodeId, setDiscountCodeId] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CARD_TO_CARD");
  const [bankAccountId, setBankAccountId] = useState(
    bankAccounts[0]?.id ?? ""
  );

  useEffect(() => {
    if (restoreGate.current) return;
    restoreGate.current = true;
    if (itemsToRestore && itemsToRestore.length > 0) {
      useCartStore.getState().restoreItems(itemsToRestore);
    }
  }, [itemsToRestore]);

  const restoredMessage =
    itemsToRestore && itemsToRestore.length > 0
      ? "پیش‌فاکتور قبلی منقضی شد و کالاها به سبد خرید برگشت."
      : null;

  const displayItems = pendingCheckout ? pendingCheckout.items : items;
  const isLocked = !!pendingCheckout;
  const pendingCheckoutId = pendingCheckout?.id ?? null;

  const subtotal = displayItems.reduce(
    (sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity,
    0
  );

  const shippingCost = useMemo(() => {
    if (pendingCheckout) return pendingCheckout.shipping_cost;
    const methodTiers = shippingTiers
      .filter((t) => t.method_id === selectedMethodId)
      .sort((a, b) => a.min_weight_grams - b.min_weight_grams);
    if (methodTiers.length === 0) return 0;
    const matched = methodTiers.find(
      (t) =>
        cartWeightGrams >= t.min_weight_grams &&
        cartWeightGrams <= t.max_weight_grams
    );
    if (matched) return matched.cost;
    return methodTiers[methodTiers.length - 1].cost;
  }, [selectedMethodId, shippingTiers, cartWeightGrams, pendingCheckout]);

  const totalBeforeWallet = Math.max(
    subtotal + shippingCost - loyaltyDiscount - discountAmount,
    0
  );

  const walletUseAmount = useWallet
    ? Math.min(walletBalance, totalBeforeWallet)
    : 0;
  const remainderAmount = Math.max(totalBeforeWallet - walletUseAmount, 0);
  const fullyCoveredByWallet =
    useWallet && remainderAmount === 0 && totalBeforeWallet > 0;

  async function handlePay(methodOverride?: PaymentMethod) {
    const effectiveMethod = methodOverride ?? paymentMethod;

    if (!selectedAddress) {
      setError("لطفاً یک آدرس انتخاب کنید.");
      return;
    }
    if (!selectedMethodId && !pendingCheckout) {
      setError("لطفاً یک روش ارسال انتخاب کنید.");
      return;
    }

    if (fullyCoveredByWallet) {
      await processPayment("ONLINE", pendingCheckoutId);
      return;
    }

    if (effectiveMethod !== "ONLINE" && !bankAccountId) {
      setError("لطفاً یک حساب بانکی برای پرداخت انتخاب کنید.");
      return;
    }

    if (effectiveMethod !== "ONLINE") {
      setPendingOfflineMethod(effectiveMethod);
      return;
    }

    await processPayment(effectiveMethod, pendingCheckoutId);
  }

  async function processPayment(
    method: PaymentMethod,
    pendingId: string | null
  ) {
    setLoading(true);
    setError(null);

    const itemPayload = displayItems.map((i) => ({
      productId: i.productId,
      name: i.name,
      image: i.image,
      price: i.price,
      discountPrice: i.discountPrice,
      selectedColor: i.selectedColor,
      selectedSize: i.selectedSize,
      quantity: i.quantity,
    }));

    if (method === "ONLINE" || fullyCoveredByWallet) {
      const result = await createOrderAndPay(
        itemPayload,
        selectedAddress,
        shippingCost,
        loyaltyPoints,
        discountCodeId,
        walletUseAmount,
        pendingId
      );
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } else {
      const result = await createOfflineOrder(
        itemPayload,
        selectedAddress,
        shippingCost,
        method,
        bankAccountId,
        loyaltyPoints,
        discountCodeId,
        walletUseAmount,
        pendingId
      );
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    }
  }

  if (displayItems.length === 0 && !pendingCheckout) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-gray-500">سبد خرید شما خالی است.</p>
        <Link
          href="/"
          className="text-green-600 text-sm hover:underline"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }
  if (addresses.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">
          برای ثبت سفارش، ابتدا باید یک آدرس در پروفایل خود ثبت کنید.
        </p>
        <Link
          href="/profile"
          className="rounded-full bg-green-600 px-6 py-2 text-sm text-white hover:bg-green-700"
        >
          افزودن آدرس
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">تکمیل خرید</h1>

      {restoredMessage && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 mb-4 text-sm">
          {restoredMessage}
        </div>
      )}

      {isLocked && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 mb-4 text-sm">
          یک پیش‌فاکتور فعال داری. تا زمانی که پرداخت نهایی رو انجام ندی یا
          پیش‌فاکتور منقضی بشه، آیتم‌های سبد خرید قفل هستن.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">انتخاب آدرس ارسال</h2>
        <div className="space-y-3">
          {addresses.map((a) => (
            <label
              key={a.id}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                selectedAddress === a.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddress === a.id}
                onChange={() => setSelectedAddress(a.id)}
                className="mt-1"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-800">
                  {a.full_name} — {a.phone}
                </p>
                <p className="text-gray-600">
                  {a.province}، {a.city}
                </p>
                <p className="text-gray-600">{a.address_line}</p>
                <p className="text-gray-500 text-xs mt-1">
                  کد پستی: {a.postal_code}
                </p>
              </div>
            </label>
          ))}
        </div>
        <Link
          href="/profile"
          className="inline-block mt-3 text-sm text-green-600 hover:underline"
        >
          + افزودن آدرس جدید
        </Link>
      </div>

      {shippingMethods.length > 0 && !isLocked && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">روش ارسال</h2>
          <div className="space-y-2">
            {shippingMethods.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${
                  selectedMethodId === m.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={selectedMethodId === m.id}
                  onChange={() => setSelectedMethodId(m.id)}
                />
                <span className="text-sm font-medium text-gray-800">
                  {m.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">خلاصه سفارش</h2>
        {displayItems.map((item) => (
          <div
            key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
            className="flex justify-between text-sm py-2 border-b last:border-0"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>
              {(
                (item.discountPrice ?? item.price) * item.quantity
              ).toLocaleString("fa-IR")}{" "}
              تومان
            </span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-2 border-b">
          <span>جمع کالاها</span>
          <span>{subtotal.toLocaleString("fa-IR")} تومان</span>
        </div>
        <div className="flex justify-between text-sm py-2 border-b">
          <span>هزینه ارسال و بسته‌بندی</span>
          <span>{shippingCost.toLocaleString("fa-IR")} تومان</span>
        </div>
        {loyaltyDiscount > 0 && (
          <div className="flex justify-between text-sm py-2 border-b text-green-600">
            <span>تخفیف امتیاز وفاداری</span>
            <span>- {loyaltyDiscount.toLocaleString("fa-IR")} تومان</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm py-2 border-b text-green-600">
            <span>تخفیف کد تخفیف</span>
            <span>- {discountAmount.toLocaleString("fa-IR")} تومان</span>
          </div>
        )}
        {walletUseAmount > 0 && (
          <div className="flex justify-between text-sm py-2 border-b text-emerald-600">
            <span>پرداخت‌شده از کیف پول</span>
            <span>- {walletUseAmount.toLocaleString("fa-IR")} تومان</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 mt-3 pt-3">
          <span>
            {remainderAmount === totalBeforeWallet
              ? "مبلغ نهایی قابل پرداخت"
              : "مبلغ باقیمانده برای پرداخت"}
          </span>
          <span>{remainderAmount.toLocaleString("fa-IR")} تومان</span>
        </div>
      </div>

      {selectedAddress && (
        <div className="mb-6">
          <ProformaInvoiceButton
            items={displayItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            storeInfo={storeInfo}
            buyer={(() => {
              const addr = addresses.find((a) => a.id === selectedAddress)!;
              return {
                fullName: addr.full_name,
                phone: addr.phone,
                province: addr.province,
                city: addr.city,
                addressLine: addr.address_line,
              };
            })()}
            shippingMethodId={selectedMethodId}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useWallet}
            onChange={(e) => setUseWallet(e.target.checked)}
            disabled={walletBalance <= 0}
            className="mt-1"
          />
          <div className="flex-1">
            <p className="font-bold text-gray-800 flex items-center gap-2">
              <Wallet size={16} className="text-emerald-600" /> استفاده از
              موجودی کیف پول
            </p>
            <p className="text-xs text-gray-500 mt-1">
              موجودی فعلی شما:{" "}
              <b>{walletBalance.toLocaleString("fa-IR")} تومان</b>
              {walletBalance <= 0 && " — کیف پول شما خالی است."}
            </p>
            {useWallet && walletUseAmount > 0 && (
              <p className="text-xs text-emerald-600 mt-1">
                {fullyCoveredByWallet
                  ? "کل مبلغ سفارش از کیف پول پرداخت می‌شود؛ نیازی به روش پرداخت دیگری نیست."
                  : `${walletUseAmount.toLocaleString(
                      "fa-IR"
                    )} تومان از کیف پول کسر و باقیمانده از طریق روش پرداخت زیر تسویه می‌شود.`}
              </p>
            )}
          </div>
        </label>
        {walletBalance <= 0 && (
          <Link
            href="/profile/wallet"
            className="inline-block mt-3 text-sm text-green-600 hover:underline"
          >
            شارژ کیف پول
          </Link>
        )}
      </div>

      {!fullyCoveredByWallet && (
        <PaymentMethodSelector
          method={paymentMethod}
          onMethodChange={setPaymentMethod}
          bankAccounts={bankAccounts}
          bankAccountId={bankAccountId}
          onBankAccountChange={setBankAccountId}
        />
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {!isLocked && (
        <div className="mb-6">
          <LoyaltyRedemptionBox
            subtotal={subtotal}
            onChange={(points, discount) => {
              setLoyaltyPoints(points);
              setLoyaltyDiscount(discount);
            }}
          />
        </div>
      )}

      {!isLocked && (
        <DiscountCodeBox
          orderTotal={Math.max(
            subtotal + shippingCost - loyaltyDiscount,
            0
          )}
          onChange={(discount, codeId) => {
            setDiscountAmount(discount);
            setDiscountCodeId(codeId);
          }}
        />
      )}

      {fullyCoveredByWallet ? (
        <button
          onClick={() => handlePay("ONLINE")}
          disabled={loading}
          className="w-full rounded-full bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading
            ? "در حال پردازش..."
            : `پرداخت ${totalBeforeWallet.toLocaleString(
                "fa-IR"
              )} تومان از کیف پول`}
        </button>
      ) : paymentMethod === "ONLINE" ? (
        <button
          onClick={() => handlePay("ONLINE")}
          disabled={true}
          className="w-full rounded-full bg-green-600 py-3.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading
            ? "در حال پردازش..."
            : isLocked
            ? "پرداخت نهایی (پیش‌فاکتور فعال)"
            : "پرداخت و ثبت نهایی سفارش"}
        </button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handlePay("CARD_TO_CARD")}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            پرداخت کارت به کارت انجام شد
          </button>
          <button
            onClick={() => handlePay("SHEBA")}
            disabled={loading}
            className="w-full rounded-xl bg-purple-600 py-3.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            پرداخت شبا انجام شد
          </button>
        </div>
      )}

      {pendingOfflineMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-3">تایید پرداخت</h3>
            <p className="text-sm text-gray-600 mb-6">
              {pendingOfflineMethod === "CARD_TO_CARD"
                ? "آیا مطمئن هستید پرداخت از طریق کارت به کارت انجام شده است؟"
                : "آیا مطمئن هستید پرداخت از طریق شبا انجام شده است؟"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const method = pendingOfflineMethod;
                  setPendingOfflineMethod(null);

                  // صفر کردن سبد خرید قبل از ثبت پرداخت آفلاین
                  useCartStore.getState().clearCart();

                  await processPayment(method, pendingCheckoutId);
                }}
                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700"
              >
                بله، پرداخت شد
              </button>
              <button
                onClick={() => setPendingOfflineMethod(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}