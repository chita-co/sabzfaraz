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