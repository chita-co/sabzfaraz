import { Phone, Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PrismaticBurstBackground from "@/components/backgrounds/PrismaticBurstBackground";
import PageImageBlock from "@/components/shop/PageImageBlock";
import { normalizePageImages } from "@/lib/pageImages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تماس با ما | سبزفراز",
  description: "راه‌های تماس با فروشگاه اینترنتی سبزفراز — شماره تماس، ایمیل و آدرس پشتیبانی.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("support_phone, support_email, store_address, extra_phones, extra_emails")
    .eq("id", 1)
    .single();

  // کوئری جدا: اگر ستون تصاویر هنوز ساخته نشده باشد، اطلاعات تماس سالم می‌ماند
  const { data: imgRow } = await supabase
    .from("site_settings")
    .select("contact_images")
    .eq("id", 1)
    .single();
  const images = normalizePageImages(imgRow?.contact_images, "contact");
  const at = (pos: string) => images.filter((i) => i.position === pos);
  const leftImages = at("beside_left");
  const rightImages = at("beside_right");
  const hasSide = leftImages.length + rightImages.length > 0;

  const phone = settings?.support_phone ?? "021-00000000";
  const email = settings?.support_email ?? "support@sabzfaraz.ir";
  const address = settings?.store_address ?? "ایران، تهران";
  const extraPhones: string[] = (settings?.extra_phones as string[]) ?? [];
  const extraEmails: string[] = (settings?.extra_emails as string[]) ?? [];

  const box = (
    <div className="dark-page-box">
      <p className="contact-line">
        <Phone size={18} /> <span dir="ltr">{phone}</span>
      </p>
      {extraPhones.map((p, i) => (
        <p key={`extra-phone-${i}`} className="contact-line">
          <Phone size={18} /> <span dir="ltr">{p}</span>
        </p>
      ))}
      <p className="contact-line">
        <Mail size={18} /> <span dir="ltr">{email}</span>
      </p>
      {extraEmails.map((e, i) => (
        <p key={`extra-email-${i}`} className="contact-line">
          <Mail size={18} /> <span dir="ltr">{e}</span>
        </p>
      ))}
      <p className="contact-line">
        <MapPin size={18} /> {address}
      </p>
    </div>
  );

  return (
    <>
      <PrismaticBurstBackground />
      <div className="dark-page">
        <div className="dark-page-inner">
          <h1 className="text-2xl font-bold mb-8">تماس با ما</h1>
          {at("before_box").map((img) => (
            <PageImageBlock key={img.id} image={img} />
          ))}
          {hasSide ? (
            <div dir="ltr" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", justifyContent: "center" }}>
              {leftImages.map((img) => (
                <PageImageBlock key={img.id} image={img} inline />
              ))}
              <div dir="rtl" style={{ flex: "1 1 280px", minWidth: 0 }}>
                {box}
              </div>
              {rightImages.map((img) => (
                <PageImageBlock key={img.id} image={img} inline />
              ))}
            </div>
          ) : (
            box
          )}
          {at("after_box").map((img) => (
            <PageImageBlock key={img.id} image={img} />
          ))}
        </div>
      </div>
    </>
  );
}