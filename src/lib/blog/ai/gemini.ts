const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  suggested_category: string;
  is_new_category: boolean;
  tags: string[];
  read_time: number;
  meta_title: string;
  meta_description: string;
  image_prompt: string;
}

export async function generateArticleWithGemini(input: {
  productName: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  brand?: string | null;
  existingCategories: string[];
  tone: string;
  minWords: number;
  maxWords: number;
  customPrompt?: string | null;
}): Promise<GeneratedArticle> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY تنظیم نشده است");

  const prompt = `
تو یک نویسنده‌ی محتوای فارسی، حرفه‌ای و سئوکار برای فروشگاه اینترنتی لوازم الکترونیک «سبزفراز» هستی.
برای محصول زیر یک مقاله‌ی کامل و جذاب مجله‌ای بنویس.

اطلاعات محصول:
- نام: ${input.productName}
- برند: ${input.brand ?? "نامشخص"}
- قیمت: ${input.price.toLocaleString("fa-IR")} تومان
- توضیح کوتاه: ${input.shortDescription ?? "-"}
- توضیح کامل: ${input.description}

دسته‌بندی‌های موجود بلاگ: ${input.existingCategories.join("، ") || "هنوز دسته‌ای ثبت نشده"}
لحن نوشتار: ${input.tone}
طول مقاله: بین ${input.minWords} تا ${input.maxWords} کلمه.
ساختار: مقدمه‌ی جذاب، بدنه (مزایا، کاربردها، راهنمای خرید، نکات فنی)، جمع‌بندی، بخش سوالات متداول (حداقل ۳ سوال).
جایی مناسب در متن (وسط یا انتهای مقاله) دقیقاً همین عبارت را به‌عنوان جای‌گاه دکمه خرید بگذار: [PRODUCT_CTA]
خروجی content باید HTML ساده باشد (تگ‌های h2, h3, p, ul, li, strong, blockquote) — بدون html, head, body.
${input.customPrompt ? `دستورالعمل اضافی: ${input.customPrompt}` : ""}

فقط یک JSON معتبر با این ساختار دقیق برگردان (بدون Markdown fence، بدون توضیح اضافه):
{
  "title": "عنوان جذاب و سئوشده فارسی (حداکثر ۶۵ کاراکتر)",
  "slug": "کوتاه، انگلیسی، kebab-case، بدون فاصله",
  "excerpt": "خلاصه ۲ تا ۳ خطی",
  "content": "متن کامل مقاله به HTML",
  "suggested_category": "نام دسته‌بندی پیشنهادی (اگر با یکی از دسته‌های موجود همخوانی دارد، دقیقاً همان نام را بنویس)",
  "is_new_category": true یا false,
  "tags": ["برچسب۱", "برچسب۲"],
  "read_time": عدد به دقیقه,
  "meta_title": "عنوان سئو (حداکثر ۶۰ کاراکتر)",
  "meta_description": "توضیح متا (حداکثر ۱۵۵ کاراکتر)",
  "image_prompt": "پرامپت انگلیسی کوتاه برای تولید تصویر کاور ۱۶:۹، بدون متن و بدون برند"
}`.trim();

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`خطای Gemini API (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("پاسخ نامعتبر از Gemini");

  try {
    return JSON.parse(text) as GeneratedArticle;
  } catch {
    throw new Error("پارس‌کردن JSON خروجی Gemini ناموفق بود");
  }
}