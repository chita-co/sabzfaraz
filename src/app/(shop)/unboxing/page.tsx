import { createClient } from "@/lib/supabase/server";
import UnboxingChannelButtons from "@/components/shop/UnboxingChannelButtons";
import UnboxingSearchGrid from "@/components/shop/UnboxingSearchGrid";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const metadata = {
  title: "آنباکس مشتریان سبزفراز | ویدیوتو بفرست، جایزه بگیر",
  description: "صدها ویدیوی آنباکس واقعی مشتریان سبزفراز را ببینید. ویدیوی خودتان را بفرستید و بین ۱۰۰ هزار تا ۱ میلیون تومان جایزه بگیرید.",
};

export default async function UnboxingPage() {
  const supabase = await createClient();
  const [{ data: videos }, { data: settings }] = await Promise.all([
    supabase
      .from("unboxing_videos")
      .select("*")
      .eq("status", "PUBLISHED")
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false }),
    supabase.from("site_settings").select("unboxing_whatsapp_number, unboxing_telegram_id, unboxing_instagram_handle").eq("id", 1).single(),
  ]);

  const list = videos ?? [];

  const videoSchema = list.slice(0, 10).map((v) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: `ویدیوی آنباکس ${v.title} ارسال‌شده توسط مشتریان فروشگاه سبزفراز`,
    thumbnailUrl: v.thumbnail_url,
    uploadDate: v.published_at,
    embedUrl: v.aparat_video_id
      ? `https://www.aparat.com/video/video/embed/videohash/${v.aparat_video_id}/vt/frame`
      : v.youtube_video_id
      ? `https://www.youtube.com/embed/${v.youtube_video_id}`
      : undefined,
  }));

  return (
    <>
      <GalaxyBackground />
      {videoSchema.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="unboxing-hero">
          <h1>🎁 ویدیوی آنباکستو بفرست، بین ۱۰۰ هزار تا ۱ میلیون تومان جایزه بگیر!</h1>
          <p>ما به بهترین ویدیوهای آنباکس، بسته به کیفیت و خلاقیت، جایزه‌ی نقدی می‌دیم — همینجا صدها ویدیوی واقعی از مشتریای سبزفراز رو ببین.</p>
        </div>

        <div className="unboxing-rules-box">
          <h2>چطور شرکت کنم؟</h2>
          <p>
            بعد از دریافت سفارش، بسته و محصول رو باز کن و حداقل یک ویدیوی ۶۰ ثانیه‌ای بگیر. ویدیو رو از طریق واتساپ،
            تلگرام یا دایرکت اینستاگرام برای ما بفرست و حتماً شماره سفارشت رو هم بنویس. تیم ما ویدیو رو بررسی می‌کنه
            و در صورت تأیید، همزمان روی آپارات، یوتیوب و اینستاگرام سبزفراز منتشرش می‌کنه — این‌جوری هرکسی با هر
            نوع اینترنتی (چه داخل ایران، چه با فیلترشکن) می‌تونه ویدیوت رو ببینه. بسته به کیفیت، خلاقیت و طول ویدیو،
            بین ۱۰۰ هزار تا ۱ میلیون تومان جایزه‌ی نقدی به کیف پولت توی سایت واریز می‌شه یا به حساب بانکیت پرداخت
            می‌گردد. همچنین یک نوتیفیکیشن داخلی بهت اطلاع می‌ده که ویدیوت تأیید و منتشر شده. اگه ویدیوت به یه محصول
            خاص مربوط باشه، توی صفحه‌ی همون محصول هم نمایش داده می‌شه تا خریدارای بعدی، تجربه‌ی واقعی تو رو ببینن.
          </p>
        </div>

        <UnboxingChannelButtons
          whatsapp={settings?.unboxing_whatsapp_number ?? null}
          telegram={settings?.unboxing_telegram_id ?? null}
          instagram={settings?.unboxing_instagram_handle ?? null}
        />

        <h2 className="section-title" style={{ marginTop: 36 }}>گالری ویدیوهای مشتریان</h2>
        <UnboxingSearchGrid videos={list} />
      </div>

      <div className="unboxing-mobile-sticky">
        <UnboxingChannelButtons
          whatsapp={settings?.unboxing_whatsapp_number ?? null}
          telegram={settings?.unboxing_telegram_id ?? null}
          instagram={settings?.unboxing_instagram_handle ?? null}
        />
      </div>
    </>
  );
}