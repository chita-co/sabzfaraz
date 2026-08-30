// lib/sep.ts
// مستندات: راهنمای استفاده از درگاه پرداخت اینترنتی سپ (سامان) - نگارش 3.6
import { fetch as undiciFetch, ProxyAgent, type Dispatcher } from "undici";

const SEP_TOKEN_URL = "https://sep.shaparak.ir/onlinepg/onlinepg";
const SEP_VERIFY_URL = "https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/VerifyTransaction";
const SEP_GATEWAY_REDIRECT = "https://sep.shaparak.ir/OnlinePG/SendToken";

// دیتابیس ما مبلغ رو به تومان نگه می‌داره، ولی سپ ریال می‌خواد
const RIAL_PER_TOMAN = 10;

interface SepTokenSuccess {
  status: 1;
  token: string;
}
interface SepTokenError {
  status: -1;
  errorCode: string;
  errorDesc: string;
}

type SepFetchOptions = Parameters<typeof undiciFetch>[1] & {
  dispatcher?: Dispatcher;
};

export async function requestPayment({
  amount,
  resNum,
  redirectUrl,
  mobile,
}: {
  amount: number;
  resNum: string;
  redirectUrl: string;
  mobile?: string;
}) {
  let data: SepTokenSuccess | SepTokenError;

  const dispatcher = process.env.NOBLE_PROXY_URL
    ? new ProxyAgent(process.env.NOBLE_PROXY_URL)
    : undefined;

  try {
    const fetchOptions: SepFetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "token",
        TerminalId: process.env.SEP_TERMINAL_ID,
        Amount: Math.round(amount * RIAL_PER_TOMAN),
        ResNum: resNum,
        RedirectUrl: redirectUrl,
        CellNumber: mobile || "",
      }),
      dispatcher,
    };

    const res = await undiciFetch(SEP_TOKEN_URL, fetchOptions);

    data = (await res.json()) as SepTokenSuccess | SepTokenError;
    console.error("SEP token response:", data);
  } catch (e) {
    console.error("SEP fetch error:", e);
    throw new Error("خطا در اتصال به درگاه پرداخت");
  }

  if (data.status !== 1 || !("token" in data)) {
    const msg =
      "errorDesc" in data
        ? data.errorDesc
        : "خطا در دریافت توکن از درگاه پرداخت";
    throw new Error(msg);
  }

  return {
    token: data.token,
    url: `${SEP_GATEWAY_REDIRECT}?token=${data.token}`,
  };
}

interface SepVerifyResponse {
  ResultCode: number;
  ResultDescription: string;
  Success: boolean;
  TransactionDetail?: {
    RRN: string;
    RefNum: string;
    MaskedPan: string;
    TerminalNumber: number;
    OriginalAmount: number;
    AffectiveAmount: number;
    StraceNo: string;
  };
}

export async function verifyPayment({
  amount,
  refNum,
}: {
  amount: number;
  refNum: string;
}) {
  const dispatcher = process.env.NOBLE_PROXY_URL
    ? new ProxyAgent(process.env.NOBLE_PROXY_URL)
    : undefined;

  const fetchOptions: SepFetchOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      RefNum: refNum,
      TerminalNumber: Number(process.env.SEP_TERMINAL_ID),
    }),
    dispatcher,
  };

  const res = await undiciFetch(SEP_VERIFY_URL, fetchOptions);

  const data = (await res.json()) as SepVerifyResponse;
  const expectedRial = Math.round(amount * RIAL_PER_TOMAN);

  // طبق مستند رسمی سپ: فقط وقتی ResultCode === 0 *و* مبلغ برگشتی دقیقاً برابر
  // مبلغ درخواستی ماست، تراکنش واقعاً موفق و قابل‌اتکاست
  const ok =
    data.ResultCode === 0 &&
    data.Success === true &&
    data.TransactionDetail?.OriginalAmount === expectedRial;

  return { ok, raw: data };
}