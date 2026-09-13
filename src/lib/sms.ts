// src/lib/sms.ts
export async function sendSms(mobile: string, text: string) {
  const res = await fetch("https://api.sms.ir/v1/send/bulk", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SMSIR_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lineNumber: Number(process.env.SMSIR_LINE_NUMBER),
      messageText: text,
      mobiles: [mobile],
      sendDateTime: null,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.status !== 1) {
    throw new Error(data.message || "خطا در ارسال پیامک");
  }
  return data;
}

export async function sendTemplateSms(
  mobile: string,
  templateId: number,
  parameters: { name: string; value: string }[]
) {
  const res = await fetch("https://api.sms.ir/v1/send/verify", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SMSIR_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mobile,
      templateId,
      parameters,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.status !== 1) {
    throw new Error(data.message || "خطا در ارسال پیامک قالبی");
  }
  return data;
}

export async function sendOrderTrackingSms(mobile: string, orderNumber: string) {
  const templateId = Number(process.env.SMSIR_ORDER_TEMPLATE_ID);
  if (!templateId) throw new Error("SMSIR_ORDER_TEMPLATE_ID تنظیم نشده است.");
  return sendTemplateSms(mobile, templateId, [{ name: "CODE", value: orderNumber }]);
}

export async function sendBulkOrderDepositSms(mobile: string, depositAmount: number) {
  const templateId = Number(process.env.SMSIR_BULK_ORDER_TEMPLATE_ID);
  if (!templateId) throw new Error("SMSIR_BULK_ORDER_TEMPLATE_ID تنظیم نشده است.");
  return sendTemplateSms(mobile, templateId, [{ name: "AMOUNT", value: depositAmount.toLocaleString("fa-IR") }]);
}

export async function sendPasswordResetOtpSms(mobile: string, code: string) {
  const templateId = Number(process.env.SMSIR_PASSWORD_RESET_TEMPLATE_ID);
  if (!templateId) throw new Error("SMSIR_PASSWORD_RESET_TEMPLATE_ID تنظیم نشده است.");
  return sendTemplateSms(mobile, templateId, [{ name: "CODE", value: code }]);
}

export async function sendPostalTrackingSms(mobile: string, trackingCode: string) {
  const templateId = Number(process.env.SMSIR_POSTAL_TRACKING_TEMPLATE_ID);
  if (!templateId) throw new Error("SMSIR_POSTAL_TRACKING_TEMPLATE_ID تنظیم نشده است.");
  return sendTemplateSms(mobile, templateId, [{ name: "CODE", value: trackingCode }]);
}

export async function sendGiftDiscountSms(
  mobile: string,
  name: string,
  discountCode: string,
  percent: number,
  validDays: number
) {
  const templateId = Number(process.env.SMSIR_GIFT_DISCOUNT_TEMPLATE_ID);
  if (!templateId) throw new Error("SMSIR_GIFT_DISCOUNT_TEMPLATE_ID تنظیم نشده است.");
  return sendTemplateSms(mobile, templateId, [
    { name: "NAME", value: name },
    { name: "PERCENT", value: String(percent) },
    { name: "DISCOUNT", value: discountCode },
    { name: "DAYS", value: String(validDays) },
  ]);
}

export async function sendLoyaltyPointsEarnedSms(
  mobile: string,
  name: string,
  points: number
) {
  const templateId = Number(process.env.SMSIR_LOYALTY_POINTS_TEMPLATE_ID);
  if (!templateId) throw new Error("SMSIR_LOYALTY_POINTS_TEMPLATE_ID تنظیم نشده است.");
  return sendTemplateSms(mobile, templateId, [
    { name: "NAME", value: name },
    { name: "POINTS", value: points.toLocaleString("fa-IR") },
  ]);
}