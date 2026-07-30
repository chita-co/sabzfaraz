import { Phone, Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PrismaticBurstBackground from "@/components/backgrounds/PrismaticBurstBackground";

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("support_phone, support_email, store_address")
    .eq("id", 1)
    .single();

  const phone = settings?.support_phone ?? "021-00000000";
  const email = settings?.support_email ?? "support@sabzfaraz.ir";
  const address = settings?.store_address ?? "ایران، تهران";

  return (
    <>
      <PrismaticBurstBackground />
      <div className="dark-page">
        <div className="dark-page-inner">
          <h1 className="text-2xl font-bold mb-8">تماس با ما</h1>
          <div className="dark-page-box">
            <p className="contact-line">
              <Phone size={18} /> <span dir="ltr">{phone}</span>
            </p>
            <p className="contact-line">
              <Mail size={18} /> <span dir="ltr">{email}</span>
            </p>
            <p className="contact-line">
              <MapPin size={18} /> {address}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}