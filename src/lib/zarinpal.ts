import ZarinpalCheckout from "zarinpal-checkout";

// وقتی مرچنت واقعی گرفتی، sandbox رو false کن
const zarinpal = ZarinpalCheckout.create(
  process.env.ZARINPAL_MERCHANT_ID || "",
  true
);

export async function requestPayment({
  amount, description, callbackUrl, mobile,
}: { amount: number; description: string; callbackUrl: string; mobile?: string }) {
  return zarinpal.PaymentRequest({
    Amount: amount,
    CallbackURL: callbackUrl,
    Description: description,
    Mobile: mobile,
  });
}

export async function verifyPayment({
  amount, authority,
}: { amount: number; authority: string }) {
  return zarinpal.PaymentVerification({ Amount: amount, Authority: authority });
}