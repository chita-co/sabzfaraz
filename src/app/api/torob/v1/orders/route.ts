import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_ORIGIN = "https://sabzfaraz.ir";
const MAX_LIMIT = 1000;

// نرمال‌سازی شماره موبایل به فرمت 09xxxxxxxxx (مورد نیاز ترب)
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // حذف همه کاراکترهای غیرعددی (فاصله، خط تیره، پرانتز و...)
  let digits = String(raw).replace(/\D/g, "");
  // حذف پیش‌شماره بین‌المللی 98
  if (digits.startsWith("98") && digits.length === 12) {
    digits = "0" + digits.slice(2);
  }
  // اگه با 9 شروع بشه و 10 رقم باشه، 0 به اولش اضافه کن
  if (digits.startsWith("9") && digits.length === 10) {
    digits = "0" + digits;
  }
  // فقط اگه فرمت نهایی درست بود (11 رقم و با 09 شروع بشه) برگردون
  if (digits.length === 11 && digits.startsWith("09")) {
    return digits;
  }
  return null;
}

// کلید عمومی واقعی ترب (پیش‌فرض تولید). فقط برای تست لوکال می‌تونی با ست‌کردن
// TOROB_PUBLIC_KEY_PEM توی .env.local موقتاً یه کلید تستی جایگزینش کنی؛
// روی ورسل/تولید چیزی لازم نیست ست بشه، همین کلید واقعی استفاده می‌شه.
const DEFAULT_TOROB_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAt6Mu4T0pBORY11W+QeM35UsmLO3vsf+6yKpFDEImFk0=
-----END PUBLIC KEY-----`;

const TOROB_PUBLIC_KEY_PEM = process.env.TOROB_PUBLIC_KEY_PEM
  ? process.env.TOROB_PUBLIC_KEY_PEM.replace(/\\n/g, "\n")
  : DEFAULT_TOROB_PUBLIC_KEY_PEM;

interface TorobJwtPayload {
  aud?: string;
  exp?: number;
  nbf?: number;
}

function base64UrlToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padLength), "base64");
}

// اعتبارسنجی JWT ترب: امضا (ed25519)، exp، nbf و aud (باید دقیقاً برابر هدر Host باشد)
function verifyTorobToken(token: string, expectedAud: string): TorobJwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string };
  let payload: TorobJwtPayload;
  try {
    header = JSON.parse(base64UrlToBuffer(headerB64).toString("utf8"));
    payload = JSON.parse(base64UrlToBuffer(payloadB64).toString("utf8"));
  } catch {
    return null;
  }

  if (header.alg !== "EdDSA") return null;

  let isValid = false;
  try {
    const publicKey = crypto.createPublicKey({ key: TOROB_PUBLIC_KEY_PEM, format: "pem" });
    const signature = base64UrlToBuffer(signatureB64);
    const signingInput = Buffer.from(`${headerB64}.${payloadB64}`, "utf8");
    isValid = crypto.verify(null, signingInput, publicKey, signature);
  } catch {
    return null;
  }
  if (!isValid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || now > payload.exp) return null;
  if (typeof payload.nbf === "number" && now < payload.nbf) return null;
  if (!payload.aud || payload.aud !== expectedAud) return null;

  return payload;
}

interface OrderRow {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  payment_status: string;
  total_amount: number;
  shipping_cost: number | null;
  torob_clid: string | null;
  address: { phone: string | null } | { phone: string | null }[] | null;
  items: { price: number; quantity: number; product_id: string | null }[] | null;
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const token = request.headers.get("x-torob-token");

  if (!token) {
    return NextResponse.json({ success: false, error: "missing X-Torob-Token header" }, { status: 401 });
  }

  const payload = verifyTorobToken(token, host);
  if (!payload) {
    return NextResponse.json({ success: false, error: "invalid or expired token" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // بررسی سوییچ فعال/غیرفعال‌بودن دسترسی ترب (تنظیمات ادمین)
  const { data: settings } = await supabase
    .from("site_settings")
    .select("torob_order_tracking_enabled")
    .eq("id", 1)
    .single();

  if (!settings?.torob_order_tracking_enabled) {
    return NextResponse.json({ success: false, error: "order tracking access is disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const purchaseTimestampGt = searchParams.get("purchase_timestamp_gt");
  const limitParam = searchParams.get("limit");

  if (!purchaseTimestampGt) {
    return NextResponse.json({ success: false, error: "purchase_timestamp_gt is required" }, { status: 400 });
  }
  const gtDate = new Date(purchaseTimestampGt);
  if (Number.isNaN(gtDate.getTime())) {
    return NextResponse.json(
      { success: false, error: "purchase_timestamp_gt must be a valid ISO 8601 timestamp" },
      { status: 400 }
    );
  }

  const limit = Number(limitParam);
  if (!limitParam || !Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return NextResponse.json(
      { success: false, error: "limit must be an integer between 1 and 1000" },
      { status: 400 }
    );
  }

  // فقط سفارش‌هایی که torob_clid دارند (یعنی منشأشان ترب بوده) و پرداخت‌شده یا لغوشده‌اند
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, updated_at, status, payment_status, total_amount, shipping_cost, torob_clid, address:addresses(phone), items:order_items(price, quantity, product_id)"
    )
    .not("torob_clid", "is", null)
    .is("deleted_at", null)
    .gt("created_at", gtDate.toISOString())
    .or("payment_status.eq.PAID,status.eq.CANCELLED")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const rows = (orders ?? []) as unknown as OrderRow[];

  // اسلاگ محصولات را یکجا (batch) می‌گیریم تا نیازی به join تودرتو نباشد
  const productIds = Array.from(
    new Set(
      rows.flatMap((o) => (o.items ?? []).map((it) => it.product_id).filter((id): id is string => !!id))
    )
  );

  let slugMap = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await supabase.from("products").select("id, slug").in("id", productIds);
    slugMap = new Map((products ?? []).map((p) => [p.id, p.slug]));
  }

  const data = rows.map((o) => {
    const address = Array.isArray(o.address) ? o.address[0] : o.address;
    const status: "completed" | "cancelled" = o.status === "CANCELLED" ? "cancelled" : "completed";
    const shippingCost = o.shipping_cost ?? 0;

    const products = (o.items ?? [])
      .filter((it) => it.product_id && slugMap.has(it.product_id))
      .map((it) => ({
        product_url: `${SITE_ORIGIN}/products/${slugMap.get(it.product_id as string)}`,
        product_price: it.price,
        quantity: it.quantity,
      }));

    const record: Record<string, unknown> = {
      purchase_timestamp: new Date(o.created_at).toISOString(),
      last_updated_timestamp: new Date(o.updated_at).toISOString(),
      torob_clid: o.torob_clid,
      status,
      order_value: o.total_amount - shippingCost,
      shipping_amount: shippingCost,
    };

    const normalizedPhone = normalizePhone(address?.phone);
    if (normalizedPhone) record.phone_number = normalizedPhone;
    if (products.length > 0) record.products = products;

    return record;
  });

  return NextResponse.json({ success: true, data });
}