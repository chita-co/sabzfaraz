import { createClient } from "@/lib/supabase/server";
import UnboxingVideoCard from "@/components/shop/UnboxingVideoCard";
import UnboxingChannelButtons from "@/components/shop/UnboxingChannelButtons";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const metadata = {
  title: "آنباکس مشتریان سبزفراز | ببین، لذت ببر و جایزه بگیر",
  description: "ویدیوهای آنباکس واقعی مشتریان سبزفراز را ببینید و با ارسال ویدیوی خودتان، ۲۰۰ هزار تومان جایزه بگیرید.",
};

export default async function UnboxingPage() {
  const supabase = await createClient();
  const [{ data: videos }, { data: settings }] = await Promise.all([
    supabase.from("unboxing_videos").select("*").eq("status", "PUBLISHED").order("is_featured", { ascending: false }).order("published_at", { ascending: false }),
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
    embedUrl: v.platform === "aparat"
      ? `https://www.aparat.com/video/video/embed/videohash/${v.video_id}/vt/frame`
      : `https://www.youtube.com/embed/${v.video_id}`,
  }));

  return (
    <>
      <GalaxyBackground />
      {videoSchema.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="unboxing-hero">
          <h1>آنباکس واقعی مشتریان سبزفراز</h1>
          <p>ببین، لذت ببر و خودت هم ۲۰۰ هزار تومان جایزه بگیر!</p>
        </div>

        <div className="unboxing-rules-box">
          <h2>برنامه‌ی آنباکس سبزفراز چیست؟</h2>
          <p>
            فروشگاه سبزفراز از تمام مشتریانی که پس از دریافت سفارش، ویدیویی از باز کردن بسته و بررسی محصول تهیه کنند
            استقبال می‌کند. این برنامه به شما کمک می‌کند تجربه‌ی واقعی خرید خود را با دیگران به اشتراک بگذارید و در
            عین حال، پاداشی نقدی دریافت کنید. کافیست پس از باز کردن بسته، حداقل یک ویدیوی ۶۰ ثانیه‌ای از محصول و
            بسته‌بندی تهیه کنید و آن را از طریق واتساپ، تلگرام یا دایرکت اینستاگرام برای تیم ما ارسال کنید. حتماً
            شماره سفارش یا کد پیگیری خود را همراه ویدیو ذکر کنید تا بتوانیم سریع‌تر آن را بررسی و به حساب شما متصل
            کنیم. تیم ما پس از بررسی، در صورت تأیید، ویدیوی شما را در کانال‌های رسمی آپارات و یوتیوب سبزفراز منتشر
            می‌کند و مبلغ ۲۰۰ هزار تومان به‌عنوان پاداش به کیف پول شما در سایت واریز می‌شود یا از طریق کارت به حساب
            بانکی‌تان پرداخت می‌گردد. همچنین یک نوتیفیکیشن داخلی به شما اطلاع‌رسانی می‌شود که ویدیوی شما تأیید و
            منتشر شده است. ویدیوهای منتشرشده در همین صفحه و در صورت مرتبط بودن با یک محصول خاص، در صفحه‌ی همان
            محصول نیز نمایش داده می‌شوند تا سایر خریداران بتوانند نظر واقعی مشتریان قبلی را مشاهده کنند. این کار
            علاوه بر افزایش اعتماد خریداران جدید، به شما هم کمک می‌کند از خریدتان بیشترین بهره را ببرید.
          </p>
        </div>

        <UnboxingChannelButtons
          whatsapp={settings?.unboxing_whatsapp_number ?? null}
          telegram={settings?.unboxing_telegram_id ?? null}
          instagram={settings?.unboxing_instagram_handle ?? null}
        />

        <h2 className="section-title" style={{ marginTop: 36 }}>ویدیوهای مشتریان</h2>
        {list.length > 0 ? (
          <div className="unboxing-grid">
            {list.map((v) => (
              <UnboxingVideoCard
                key={v.id} id={v.id} title={v.title}
                platform={v.platform as "aparat" | "youtube"} videoId={v.video_id}
                thumbnailUrl={v.thumbnail_url} customerName={v.customer_name} isFeatured={v.is_featured}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-300">هنوز ویدیویی منتشر نشده — اولین نفر باش!</p>
        )}
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