// src/lib/postTracking.ts
//
// این فایل مسئول گرفتن وضعیتِ لحظه‌ایِ یک مرسوله‌ی پستی (شهر، تحویل‌گیرنده، تاریخ و ساعت) است.
// از دو سرویس پشتیبانی می‌کند:
//
//   ۱) Track123  → برای مرسولات «پست ایران» (چون پست ایران خودش API رسمی و رایگان نداره)
//   ۲) iNeo Team → یک واسط برای رهگیری مستقیم «تیپاکس» (چون تیپاکس یک API رسمی برای فروشندگان
//      بزرگ داره ولی نیاز به قرارداد جداگانه داره؛ iNeo Team یک واسطه‌ی آماده و سریع‌تره)
//
// نکته‌ی مهم برای توسعه‌دهنده‌ی بعدی (یا خودت وقتی کلید گرفتی):
// فیلدهای پاسخ سرویس iNeo Team را نتوانستم به‌صورت مستند و قطعی تأیید کنم (سایت مستنداتشون
// اجازه‌ی خزش خودکار نمی‌ده). پس اگر بعد از گرفتن accessKey، پاسخ درست پارس نشد، یک درخواست
// دستی به آدرس زیر بزن (با کد رهگیری واقعی) و JSON خروجی رو برای اصلاح دقیق پارسر بفرست:
//   https://api.ineo-team.ir/Tipax.php?accessKey=KEY&action=tracking&id=CODE

export type PostalTrackingEvent = {
  date: string; // مثلاً "1404/06/18"
  time: string; // مثلاً "14:32"
  location: string; // شهر / مرکز پستی
  description: string; // توضیح وضعیت (مثلاً «تحویل به مأمور پیک»)
};

export type PostalTrackingResult =
  | {
      status: "found";
      currentStatus: string; // خلاصه‌ی وضعیت فعلی (مثلاً «در حال توزیع»)
      events: PostalTrackingEvent[]; // تاریخچه، از جدید به قدیم
      deliveredTo?: string | null; // نام تحویل‌گیرنده (اگر تحویل داده شده باشه)
    }
  | { status: "not_found" }
  | { status: "provider_not_configured"; fallbackUrl: string }
  | { status: "error"; message: string };

const TRACK123_API_KEY = process.env.TRACK123_API_KEY;
const TRACK123_BASE_URL = "https://api.track123.com/gateway/open-api/tk/v2";

const TIPAX_ACCESS_KEY = process.env.TIPAX_ACCESS_KEY;
const TIPAX_BASE_URL = "https://api.ineo-team.ir/Tipax.php";

/**
 * @param trackingCode کد رهگیری که کاربر وارد کرده
 * @param courierHint نام روش ارسال سفارش (مثلاً "پست پیشتاز" یا "تیپاکس")؛ برای انتخاب سرویس درست استفاده می‌شود
 */
export async function getPostalTrackingStatus(
  trackingCode: string,
  courierHint?: string | null
): Promise<PostalTrackingResult> {
  const code = trackingCode.trim();
  if (!code) return { status: "not_found" };

  const isTipax = (courierHint ?? "").toLowerCase().includes("تیپاکس") ||
    (courierHint ?? "").toLowerCase().includes("tipax");

  if (isTipax) {
    if (TIPAX_ACCESS_KEY) return fetchFromTipax(code);
    return {
      status: "provider_not_configured",
      fallbackUrl: `https://www.tipax.ir/tracking?code=${encodeURIComponent(code)}`,
    };
  }

  if (TRACK123_API_KEY) return fetchFromTrack123(code);

  // اگر هنوز سرویسی وصل نکردی، حداقل یک مسیر امن (fallback) برمی‌گردونیم
  return {
    status: "provider_not_configured",
    fallbackUrl: `https://tracking.post.ir/?id=${encodeURIComponent(code)}`,
  };
}

async function fetchFromTrack123(code: string): Promise<PostalTrackingResult> {
  try {
    // مرحله ۱: وارد کردن کد به سیستم Track123 (فقط بار اول لازمه، بارهای بعدی هم مشکلی نداره)
    await fetch(`${TRACK123_BASE_URL}/track/import`, {
      method: "POST",
      headers: {
        "Track123-Api-Secret": TRACK123_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ trackNo: code, courierCode: "iran-post" }]),
    });

    // مرحله ۲: گرفتن وضعیت
    const res = await fetch(`${TRACK123_BASE_URL}/track/query`, {
      method: "POST",
      headers: {
        "Track123-Api-Secret": TRACK123_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trackNos: [code] }),
    });

    if (!res.ok) {
      return { status: "error", message: "خطا در ارتباط با سرویس رهگیری" };
    }

    const data = await res.json();
    const item =
  data?.data?.accepted?.content?.[0] ??
  data?.data?.content?.[0] ??
  data?.data?.[0] ??
  null;
    if (!item) return { status: "not_found" };

    const rawEvents = item.localLogisticsInfo?.trackingDetails ?? [];

    const events: PostalTrackingEvent[] = rawEvents.map(
      (ev: { eventTime?: string; address?: string; eventDetail?: string }) => {
        const dt = ev.eventTime ? new Date(ev.eventTime.replace(" ", "T")) : null;
        return {
          date: dt ? dt.toLocaleDateString("fa-IR") : "—",
          time: dt ? dt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "—",
          location: ev.address ?? "—",
          description: ev.eventDetail ?? "—",
        };
      }
    );

    const statusMap: Record<string, string> = {
      NO_RECORD: "هنوز رویدادی از پست دریافت نشده (لطفاً چند ساعت دیگر دوباره بررسی کنید)",
      INFO_RECEIVED: "اطلاعات مرسوله دریافت شد",
      IN_TRANSIT: "در حال ارسال",
      OUT_FOR_DELIVERY: "در حال توزیع",
      DELIVERED: "تحویل داده شد",
      EXPIRED: "به‌روزرسانی متوقف شده (اطلاعاتی دریافت نشد)",
      ALERT: "مشکل در تحویل",
      UNDELIVERED: "عدم تحویل",
    };

    const transitStatus: string | undefined = item.transitStatus;

    return {
      status: "found",
      currentStatus:
        (transitStatus && statusMap[transitStatus]) ?? transitStatus ?? "در حال پردازش",
      events,
      deliveredTo: item.lastMileInfo?.consigneeName ?? null,
    };
  } catch {
    return { status: "error", message: "خطا در ارتباط با سرویس رهگیری" };
  }
}

async function fetchFromTipax(code: string): Promise<PostalTrackingResult> {
  try {
    const url = `${TIPAX_BASE_URL}?accessKey=${encodeURIComponent(
      TIPAX_ACCESS_KEY as string
    )}&action=tracking&id=${encodeURIComponent(code)}`;

    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      return { status: "error", message: "خطا در ارتباط با سرویس رهگیری تیپاکس" };
    }

    const data = await res.json();

    // ⚠️ فیلدهای زیر بر اساس نمونه‌ی عمومی مستندات نوشته شده و باید بعد از اولین
    // فراخوانی واقعی، با پاسخ راستین سرویس تطبیق داده بشه (توضیح بالای فایل رو ببین).
    if (data?.status === false || data?.error) {
      return { status: "not_found" };
    }

    const result = data?.result ?? data?.data ?? data;
    const rawEvents = result?.events ?? result?.history ?? result?.tracking ?? [];

    const events: PostalTrackingEvent[] = (Array.isArray(rawEvents) ? rawEvents : []).map(
      (ev: { date?: string; time?: string; city?: string; location?: string; description?: string; title?: string }) => ({
        date: ev.date ?? "—",
        time: ev.time ?? "—",
        location: ev.city ?? ev.location ?? "—",
        description: ev.description ?? ev.title ?? "—",
      })
    );

    return {
      status: "found",
      currentStatus: result?.status ?? result?.currentStatus ?? "در حال پردازش",
      events,
      deliveredTo: result?.receiverName ?? result?.deliveredTo ?? null,
    };
  } catch {
    return { status: "error", message: "خطا در ارتباط با سرویس رهگیری تیپاکس" };
  }
}