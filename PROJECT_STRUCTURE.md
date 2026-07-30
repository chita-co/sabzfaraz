# ساختار پروژه سبزفراز (sabzfaraz)

> فروشگاه اینترنتی الکترونیک — Next.js 16 (App Router) + Supabase + آروان‌کلاد + زرین‌پال + sms.ir

```
sabzfaraz/
├── .env.local                          # کلیدهای محرمانه (لوکال)
├── next.config.ts                      # تنظیمات Next (remotePatterns تصاویر)
│
├── src/
│   ├── middleware.ts                   # تازه‌نگه‌داشتن نشست ورود
│   │
│   ├── types/
│   │   └── index.ts                    # تایپ‌های Product, Category, Banner, ...
│   │
│   ├── store/
│   │   └── cart-store.ts               # سبد خرید (zustand, localStorage)
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # کلاینت مرورگر
│   │   │   ├── server.ts               # کلاینت سرور (کوکی)
│   │   │   └── admin.ts                # کلاینت service-role
│   │   ├── arvan.ts                    # آپلود/حذف تصویر (آروان‌کلاد)
│   │   ├── sku.ts                      # ساخت خودکار کد محصول
│   │   ├── zarinpal.ts                 # درگاه پرداخت
│   │   ├── sms.ts                      # ارسال پیامک (sms.ir)
│   │   ├── tracking.ts                 # منطق ۵ مرحله پیگیری سفارش
│   │   └── iran-locations.ts           # لیست استان/شهر ایران
│   │
│   ├── components/
│   │   ├── ShinyText.tsx / .css        # افکت درخشش اسم سایت
│   │   ├── GooeyNav.tsx / .css         # افکت ذره‌ای منوی هدر
│   │   ├── backgrounds/                # پس‌زمینه‌های انیمیشنی (react-bits)
│   │   │   ├── GalaxyBackground.tsx        # صفحه اصلی
│   │   │   ├── GridScanBackground.tsx      # ورود/ثبت‌نام
│   │   │   ├── HyperspeedBackground.tsx    # سفارشات من
│   │   │   ├── IridescenceBackground.tsx   # پرداخت موفق
│   │   │   ├── LightfallBackground.tsx     # تکمیل خرید
│   │   │   ├── SilkBackground.tsx          # صفحه محصول
│   │   │   ├── FloatingLinesBackground.tsx # علاقه‌مندی‌ها
│   │   │   ├── GrainientBackground.tsx     # پروفایل
│   │   │   ├── AuroraBackground.tsx        # (پشتیبان/جایگزین)
│   │   │   ├── AntigravityBackground.tsx   # (پشتیبان/جایگزین)
│   │   │   └── PrismaticBurstBackground.tsx# (پشتیبان/جایگزین)
│   │   │
│   │   ├── shared/
│   │   │   ├── CustomSelect.tsx        # منوی کشویی سفارشی (رو‌به‌پایین)
│   │   │   └── ProvinceCitySelect.tsx  # انتخاب استان/شهر
│   │   │
│   │   ├── shop/                       # کامپوننت‌های سمت فروشگاه
│   │   │   ├── Header.tsx              # هدر (سرور، فچ لوگو/دسته/کاربر)
│   │   │   ├── HeaderNav.tsx           # هدر (کلاینت، منو/سرچ/سبد)
│   │   │   ├── TopFilterBar.tsx        # نوار مرتب‌سازی زیر هدر
│   │   │   ├── ProductSortSelect.tsx   # منوی جدیدترین/ارزان‌ترین/...
│   │   │   ├── Pagination.tsx          # صفحه‌بندی محصولات
│   │   │   ├── Footer.tsx              # فوتر (داینامیک، سبز-طلایی)
│   │   │   ├── BackToTop.tsx           # دکمه بازگشت به بالا
│   │   │   ├── HeroCarousel.tsx        # اسلایدر بنر بالای صفحه
│   │   │   ├── DealsSection.tsx        # ردیف جشنواره تخفیف
│   │   │   ├── RelatedProducts.tsx     # کالاهای مشابه (صفحه محصول)
│   │   │   ├── ProductCard.tsx         # کارت محصول (همه‌جا مشترک)
│   │   │   ├── QuickAddButton.tsx      # افزودن سریع به سبد (روی کارت)
│   │   │   ├── WishlistButton.tsx      # دکمه قلب علاقه‌مندی
│   │   │   ├── ProductDetail.tsx       # صفحه تکی محصول
│   │   │   ├── StarRating.tsx          # نمایش/ورودی ستاره امتیاز
│   │   │   ├── ProductReviewsDisplay.tsx # نمایش نظرات زیر محصول
│   │   │   ├── ProductReviewsSection.tsx # فرم ثبت امتیاز (سفارشات من)
│   │   │   ├── CartClient.tsx          # صفحه سبد خرید
│   │   │   ├── CheckoutClient.tsx      # صفحه تکمیل خرید
│   │   │   ├── ClearCartOnSuccess.tsx  # خالی‌کردن سبد بعد پرداخت
│   │   │   ├── InvoiceDownloadButton.tsx # دانلود فاکتور PDF
│   │   │   ├── ProfileClient.tsx       # پروفایل + آدرس‌ها
│   │   │   ├── OrdersListClient.tsx    # لیست سفارشات + پیگیری
│   │   │   ├── NewTicketButton.tsx     # شروع گفتگوی پشتیبانی
│   │   │   └── SupportChatClient.tsx   # چت پشتیبانی (کاربر)
│   │   │
│   │   └── admin/                      # کامپوننت‌های پنل مدیریت
│   │       ├── AdminSidebar.tsx        # سایدبار گروه‌بندی‌شده
│   │       ├── AdminSwitch.tsx         # دکمه سوییچ (toggle)
│   │       ├── ProductForm.tsx         # فرم افزودن/ویرایش محصول
│   │       ├── ProductsTable.tsx       # جدول محصولات
│   │       ├── CategoryManager.tsx     # مدیریت دسته‌بندی + زیردسته
│   │       ├── BannerManager.tsx       # مدیریت بنر اسلایدی
│   │       ├── DealsManager.tsx        # مدیریت جشنواره تخفیف
│   │       ├── ShippingRatesManager.tsx# هزینه ارسال استان/شهر
│   │       ├── TrackingSettingsForm.tsx# متن ۵ مرحله پیگیری
│   │       ├── SiteAssetsManager.tsx   # لوگو + بنرهای تبلیغاتی
│   │       ├── GeneralSettingsForm.tsx # نام/تلفن/ایمیل/آدرس/درباره‌ما
│   │       ├── BackupClient.tsx        # دانلود پشتیبان JSON
│   │       ├── CreateUserForm.tsx      # افزودن کاربر دستی
│   │       ├── UserRoleControl.tsx     # تغییر نقش کاربر
│   │       ├── OrderStatusControl.tsx  # تغییر وضعیت سفارش
│   │       ├── OrderDeleteButton.tsx   # حذف سفارش
│   │       ├── StartTrackingButton.tsx # شروع پیگیری خودکار
│   │       ├── ReviewsManager.tsx      # مدیریت/حذف نظرات کاربران
│   │       ├── AdminSupportChat.tsx    # چت پشتیبانی (ادمین)
│   │       └── SalesAnalytics.tsx      # نمودار فروش (recharts)
│   │
│   └── app/
│       ├── layout.tsx                  # لایوت ریشه (html/body/فونت)
│       ├── globals.css                 # استایل پایه Tailwind
│       │
│       ├── (auth)/                     # گروه صفحات ورود/ثبت‌نام
│       │   ├── layout.tsx
│       │   ├── auth.css                # استایل باکس آبی/سرمه‌ای
│       │   ├── actions.ts              # signIn/signUp/OTP بازیابی رمز
│       │   ├── AuthCard.tsx            # فرم مشترک ورود+ثبت‌نام
│       │   ├── PasswordInput.tsx       # فیلد رمز با چشم نمایش
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   └── forgot-password/page.tsx# فراموشی رمز با کد پیامکی
│       │
│       ├── auth/callback/route.ts      # کال‌بک تایید ایمیل (احتیاطی)
│       │
│       ├── (shop)/                     # گروه صفحات عمومی فروشگاه
│       │   ├── layout.tsx              # هدر+فوتر+نوار فیلتر مشترک
│       │   ├── shop.css                # استایل کل فروشگاه
│       │   ├── page.tsx                # صفحه اصلی
│       │   ├── products/page.tsx       # همه محصولات (سورت+صفحه‌بندی)
│       │   ├── products/[slug]/
│       │   │   ├── page.tsx            # صفحه تکی محصول
│       │   │   └── product-detail.css
│       │   ├── category/[slug]/page.tsx# صفحه دسته‌بندی
│       │   ├── search/page.tsx         # نتایج جستجو
│       │   ├── deals/page.tsx          # همه محصولات تخفیف‌دار
│       │   ├── wishlist/page.tsx       # علاقه‌مندی‌ها
│       │   ├── cart/page.tsx           # سبد خرید
│       │   ├── checkout/
│       │   │   ├── page.tsx            # تکمیل خرید
│       │   │   └── actions.ts          # ثبت سفارش + اتصال زرین‌پال
│       │   ├── order/[id]/page.tsx     # نتیجه پرداخت (موفق/ناموفق)
│       │   ├── profile/
│       │   │   ├── page.tsx            # پروفایل من
│       │   │   ├── actions.ts          # ویرایش پروفایل/آدرس
│       │   │   └── orders/
│       │   │       ├── page.tsx        # سفارشات من + پیگیری
│       │   │       ├── review-actions.ts # ثبت امتیاز/نظر
│       │   │       └── [id]/page.tsx   # جزئیات یک سفارش
│       │   ├── support/
│       │   │   ├── page.tsx            # لیست گفتگوهای پشتیبانی
│       │   │   ├── actions.ts
│       │   │   └── [id]/page.tsx       # چت یک گفتگو
│       │   ├── about/page.tsx          # درباره ما (پس‌زمینه مشکی)
│       │   ├── contact/page.tsx        # تماس با ما (داینامیک)
│       │   ├── faq/page.tsx            # سوالات متداول
│       │   ├── terms/page.tsx          # قوانین و مقررات
│       │   └── privacy/page.tsx        # حریم خصوصی
│       │
│       ├── admin/                      # پنل مدیریت
│       │   ├── layout.tsx              # گارد ورود ادمین + سایدبار
│       │   ├── admin.css               # استایل کل پنل (تیره/طلایی)
│       │   ├── page.tsx                # داشبورد (کارت‌های آماری)
│       │   ├── analytics/page.tsx      # گزارش فروش + نمودار
│       │   ├── categories/
│       │   │   ├── page.tsx
│       │   │   └── actions.ts
│       │   ├── products/
│       │   │   ├── page.tsx
│       │   │   ├── new/page.tsx
│       │   │   ├── [id]/edit/page.tsx
│       │   │   └── actions.ts          # شامل ساخت SKU خودکار
│       │   ├── banners/
│       │   │   ├── page.tsx
│       │   │   └── actions.ts
│       │   ├── deals/
│       │   │   ├── page.tsx
│       │   │   └── actions.ts
│       │   ├── orders/
│       │   │   ├── page.tsx            # تب‌های وضعیت + حذف
│       │   │   ├── actions.ts
│       │   │   └── [id]/
│       │   │       ├── page.tsx        # جزئیات سفارش
│       │   │       └── invoice/page.tsx# فاکتور چاپی
│       │   ├── users/
│       │   │   ├── page.tsx
│       │   │   ├── new/page.tsx        # افزودن کاربر دستی
│       │   │   ├── roles/page.tsx      # آمار نقش‌ها
│       │   │   ├── [id]/page.tsx
│       │   │   └── actions.ts
│       │   ├── shipping/
│       │   │   ├── page.tsx            # هزینه ارسال استان/شهر
│       │   │   └── actions.ts
│       │   ├── tracking-settings/page.tsx
│       │   ├── site-settings/page.tsx  # لوگو + بنر تبلیغاتی
│       │   ├── settings/
│       │   │   ├── general/page.tsx    # نام/تماس/آدرس/درباره‌ما
│       │   │   ├── backup/page.tsx     # دانلود پشتیبان JSON
│       │   │   └── actions.ts
│       │   ├── finance/
│       │   │   ├── transactions/page.tsx # لیست تراکنش‌ها
│       │   │   └── invoices/page.tsx     # لیست صورتحساب‌ها
│       │   ├── reviews/
│       │   │   ├── page.tsx            # مدیریت نظرات
│       │   │   └── actions.ts
│       │   └── support/
│       │       ├── page.tsx            # لیست گفتگوهای کاربران
│       │       ├── actions.ts
│       │       └── [id]/page.tsx       # چت (بستن/حذف گفتگو)
│       │
│       └── api/
│           ├── admin/
│           │   ├── upload/route.ts     # آپلود تصویر محصول/بنر/لوگو
│           │   └── backup/route.ts     # خروجی JSON پشتیبان
│           ├── payment/callback/route.ts # کال‌بک زرین‌پال + پیامک
│           └── support/upload/route.ts # آپلود عکس چت پشتیبانی
```

---

## جدول کوتاه دیتابیس (Supabase)

| جدول | کاربرد |
|---|---|
| `profiles` | اطلاعات کاربر + نقش |
| `addresses` | آدرس‌های کاربر |
| `categories` | دسته‌بندی + زیردسته + تصویر |
| `products` | محصولات + رنگ/سایز/SKU/امتیاز |
| `carts` / `cart_items` | (پایه اولیه، سبد نهایی سمت کلاینت است) |
| `orders` / `order_items` | سفارش‌ها |
| `banners` | بنر اسلایدی صفحه اصلی |
| `site_settings` | تک‌ردیفی؛ تمام تنظیمات سراسری سایت |
| `shipping_rates` | هزینه ارسال بر اساس استان/شهر |
| `wishlists` | علاقه‌مندی‌ها |
| `product_reviews` | امتیاز و نظر کاربران |
| `support_tickets` / `support_messages` | پشتیبانی |
| `password_reset_otps` | کد یکبارمصرف بازیابی رمز |

---

## پکیج‌های کلیدی نصب‌شده
`@supabase/supabase-js`, `@supabase/ssr`, `zustand`, `@aws-sdk/client-s3`, `sharp`, `zarinpal-checkout`, `jspdf`, `jspdf-autotable`, `html2canvas`, `recharts`, `lucide-react`, `motion`
