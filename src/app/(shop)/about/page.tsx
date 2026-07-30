import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import AntigravityBackground from "@/components/backgrounds/AntigravityBackground";

async function AboutContent() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("store_name, about_content")
    .eq("id", 1)
    .single();

  const storeName = settings?.store_name ?? "سبزفراز";
  const content = settings?.about_content;

  return (
    <>
      <AntigravityBackground />
      <div className="mx-auto max-w-3xl px-4 py-12 relative z-10">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#fbbf24" }}>
          درباره {storeName}
        </h1>
        <div className="leading-8" style={{ color: "#f0f0f0" }}>
          {content ? (
            <p style={{ whiteSpace: "pre-line" }}>{content}</p>
          ) : (
            <p>
              {storeName} یک فروشگاه اینترنتی تخصصی در زمینه‌ی فروش قطعات، ماژول‌ها و
              تجهیزات الکترونیکی است. هدف ما فراهم کردن دسترسی آسان، سریع و مطمئن به
              قطعاتی است که برای پروژه‌های آموزشی، صنعتی و هابی مورد نیاز دارید.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">در حال بارگذاری...</div>}>
      <AboutContent />
    </Suspense>
  );
}