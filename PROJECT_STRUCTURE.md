cat > /mnt/user-data/outputs/PROJECT_STRUCTURE.md << 'EOF'
# ساختار پروژه سبزفراز (sabzfaraz) — نسخه‌ی کامل و به‌روز

> فروشگاه اینترنتی الکترونیک — Next.js 16 (App Router) + Supabase + آروان‌کلاد + زرین‌پال + sms.ir
> این نسخه شامل تمام افزوده‌های بعد از نسخه‌ی اول (باشگاه مشتریان، آنباکس، آمار بازدید، فاکتور/برچسب مرسوله، محصولات استوک/تمام‌شده، ارسال وزنی و ...) است.

```
sabzfaraz/
├── .env.local                          # کلیدهای محرمانه (لوکال)
├── next.config.ts                      # تنظیمات Next (remotePatterns تصاویر)
├── vercel.json                         # تعریف Cron Jobها (پاکسازی آمار، انقضای امتیاز، یادآوری)
│
├── src/
│   ├── proxy.ts                        # میان‌افزار تازه‌نگه‌داشتن نشست (جایگزین middleware.ts)
│   │
│   ├── types/
│   │   └── index.ts                    # Product (+وزن/استوک/امتیاز/تصاویر توضیحات)، Category، Banner، ProductQuantityTier، ...
│   │
│   ├── store/
│   │   └── cart-store.ts               # سبد خرید (zustand) + وزن هر قلم + restoreItems (بازگشت از پیش‌فاکتور منقضی)
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # کلاینت مرورگر
│   │   │   ├── server.ts               # کلاینت سرور (کوکی)
│   │   │   └── admin.ts                # کلاینت service-role
│   │   ├── arvan.ts                    # آپلود/حذف تصویر (آروان‌کلاد)
│   │   ├── sku.ts                      # ساخت خودکار کد محصول
│   │   ├── slug.ts                     # ساخت اسلاگ یکتا (رفع باگ تکراری بودن)
│   │   ├── zarinpal.ts                 # درگاه پرداخت
│   │   ├── sms.ts                      # ارسال پیامک (sms.ir)
│   │   ├── tracking.ts                 # منطق ۵ مرحله پیگیری سفارش
│   │   ├── iran-locations.ts           # لیست استان/شهر ایران
│   │   ├── ratings.ts                  # (قدیمی، دیگر استفاده نمی‌شود — امتیاز روی خود محصول کش می‌شود)
│   │   ├── buildInvoiceHtml.ts         # قالب مشترک پیش‌فاکتور/فاکتور نهایی
│   │   ├── generateInvoicePdf.ts       # رندر HTML فاکتور به PDF (html2canvas-pro)
│   │   ├── generateLabelPdf.ts         # رندر برچسب مرسوله به PDF
│   │   ├── invoiceImage.ts             # تبدیل لوگو به data-uri سمت کلاینت (رفع CORS)
│   │   ├── fetchImageAsDataUri.server.ts # همان کار، سمت سرور (فاکتور ادمین)
│   │   │
│   │   ├── analytics/                  # ماژول آمار بازدیدکنندگان (اختصاصی، بدون سرویس خارجی)
│   │   │   ├── parseUserAgent.ts       # تشخیص دستگاه/مرورگر/OS
│   │   │   ├── botDetection.ts         # فیلتر ربات‌ها/خزنده‌ها
│   │   │   ├── trafficSource.ts        # طبقه‌بندی منبع ترافیک (مستقیم/ارگانیک/شبکه اجتماعی/ترب/AI/...)
│   │   │   ├── hashIp.ts               # هش SHA-256 آی‌پی
│   │   │   └── logConversion.ts        # اتصال سفارش موفق به نشست آماری
│   │   │
│   │   ├── loyalty/                    # باشگاه مشتریان و امتیازدهی
│   │   │   ├── settings.ts             # خواندن تنظیمات + محاسبه سقف مصرف امتیاز
│   │   │   ├── points-utils.ts         # calculatePointsToEarn (مستقل از سرور، برای کلاینت)
│   │   │   └── ledger.ts               # دفتر کل: کسب/مصرف/بازگشت/انقضا/سطح‌بندی (FIFO)
│   │   │
│   │   ├── wallet/
│   │   │   └── creditWallet.ts         # واریز پاداش به کیف پول کاربر
│   │   │
│   │   ├── unboxing/                   # سیستم ویدیوی آنباکس
│   │   │   ├── videoHelpers.ts         # استخراج شناسه/ساخت لینک embed و تامبنیل
│   │   │   └── detectPlatformAccess.ts # تشخیص خودکار دسترسی به آپارات/یوتیوب
│   │   │
│   │   └── notifications.ts            # ساخت نوتیفیکیشن داخلی کاربر
│   │
│   ├── components/
│   │   ├── ShinyText.tsx / .css        # افکت درخشش اسم سایت
│   │   ├── GooeyNav.tsx / .css         # افکت ذره‌ای منوی هدر (شامل آیتم آنباکس)
│   │   ├── AnalyticsTracker.tsx        # ردیاب سبک کلاینتی (session/visitor id, page duration)
│   │   │
│   │   ├── backgrounds/                # پس‌زمینه‌های انیمیشنی (react-bits)
│   │   │   ├── GalaxyBackground.tsx        # صفحه اصلی، /products، /newest، /popular، /deals، /unboxing
│   │   │   ├── ParticlesBackground.tsx     # صفحات دسته‌بندی و زیردسته
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
│   │   │   ├── CustomSelect.tsx        # منوی کشویی سفارشی
│   │   │   └── ProvinceCitySelect.tsx  # انتخاب استان/شهر
│   │   │
│   │   ├── shop/                       # کامپوننت‌های سمت فروشگاه
│   │   │   ├── Header.tsx              # هدر (سرور، فچ لوگو/دسته/کاربر)
│   │   │   ├── HeaderNav.tsx           # هدر (کلاینت) — سرچ، آنباکس، اعلان، باشگاه مشتریان، سبد
│   │   │   ├── NotificationBell.tsx    # زنگ اعلان داخلی (پلی هر ۶۰ثانیه)
│   │   │   ├── Breadcrumb.tsx          # مسیر صفحه (خانه / دسته / زیردسته / محصول)
│   │   │   ├── DescriptionModal.tsx    # پاپ‌آپ توضیحات با سایز ثابت + اسکرول داخلی
│   │   │   ├── TopFilterBar.tsx        # نوار مرتب‌سازی سراسری (فقط صفحه اصلی)
│   │   │   ├── ProductSortSelect.tsx   # منوی جدیدترین/ارزان‌ترین/گران‌ترین/محبوب‌ترین
│   │   │   ├── PageSizeSelect.tsx      # انتخاب ۲۰/۵۰/۱۰۰ محصول در صفحه (فروشگاه)
│   │   │   ├── ProductListClient.tsx   # لیست محصولات با واکشی کلاینتی (بدون رفرش)
│   │   │   ├── Pagination.tsx          # صفحه‌بندی (پشتیبانی تم روشن/تیره)
│   │   │   ├── Footer.tsx              # فوتر داینامیک (شامل لینک آنباکس)
│   │   │   ├── BackToTop.tsx
│   │   │   ├── HeroCarousel.tsx        # اسلایدر بنر (opacity-fade، بدون بلور)
│   │   │   ├── HorizontalProductSection.tsx # ردیف افقی جدیدترین/پرطرفدار/استوک با «مشاهده همه»
│   │   │   ├── DealsSection.tsx        # ردیف جشنواره تخفیف
│   │   │   ├── RelatedProducts.tsx     # کالاهای مشابه
│   │   │   ├── ProductCard.tsx         # کارت محصول + برچسب استوک/تمام‌شده + امتیاز
│   │   │   ├── QuickAddButton.tsx
│   │   │   ├── WishlistButton.tsx
│   │   │   ├── ProductDetail.tsx       # صفحه محصول: قیمت پلکانی، امتیاز وفاداری، تب آنباکس محصول
│   │   │   ├── StarRating.tsx
│   │   │   ├── ProductReviewsDisplay.tsx
│   │   │   ├── ProductReviewsSection.tsx
│   │   │   ├── ProductUnboxingSection.tsx # ویدیوهای آنباکس مرتبط با همان محصول
│   │   │   ├── CartClient.tsx          # سبد خرید + اعمال حداقل مبلغ سفارش
│   │   │   ├── CheckoutClient.tsx      # تکمیل خرید: روش ارسال وزنی، امتیاز، پیش‌فاکتور، قفل نشست
│   │   │   ├── LoyaltyRedemptionBox.tsx# اسلایدر مصرف امتیاز در تسویه‌حساب
│   │   │   ├── ProformaInvoiceButton.tsx # صدور پیش‌فاکتور PDF + رزرو ۲۴ساعته سبد
│   │   │   ├── ClearCartOnSuccess.tsx
│   │   │   ├── InvoiceDownloadButton.tsx # دانلود فاکتور نهایی PDF
│   │   │   ├── ProfileClient.tsx
│   │   │   ├── OrdersListClient.tsx
│   │   │   ├── NewTicketButton.tsx
│   │   │   ├── SupportChatClient.tsx
│   │   │   ├── UnboxingVideoCard.tsx   # کارت گرید آنباکس (تشخیص پلتفرم + نقطه‌های رنگی)
│   │   │   ├── UnboxingVideoModal.tsx  # مودال پخش با تب آپارات/یوتیوب/اینستاگرام
│   │   │   ├── UnboxingSearchGrid.tsx  # سرچ+گرید سه‌ستونه صفحه‌ی /unboxing
│   │   │   └── UnboxingChannelButtons.tsx # دکمه‌های واتساپ/تلگرام/اینستاگرام
│   │   │
│   │   └── admin/                      # کامپوننت‌های پنل مدیریت
│   │       ├── AdminSidebar.tsx        # سایدبار گروه‌بندی‌شده (شامل باشگاه مشتریان، آنباکس، آمار بازدید)
│   │       ├── AdminSwitch.tsx
│   │       ├── ProductForm.tsx         # فرم محصول: وزن، تصاویر توضیحات، تخفیف پلکانی، افزودن گروهی
│   │       ├── ProductsTable.tsx       # جدول با sync خودکار prop (رفع باگ فیلتر)، کپی، تاریخچه قیمت
│   │       ├── AdminProductsListClient.tsx # پوسته‌ی فیلتر+جدول با واکشی کلاینتی (بدون رفرش)
│   │       ├── AdminProductFilters.tsx # (قدیمی، دیگر استفاده نمی‌شود)
│   │       ├── BulkEditModal.tsx       # ویرایش گروهی چند محصول انتخابی
│   │       ├── CategoryManager.tsx
│   │       ├── BannerManager.tsx
│   │       ├── DealsManager.tsx        # + دکمه سوییچ AdminSwitch
│   │       ├── StockManager.tsx        # مدیریت «محصولات استوک»
│   │       ├── OutOfStockManager.tsx   # مدیریت «محصولات تمام‌شده» + شارژ مجدد
│   │       ├── ShippingRatesManager.tsx# (قدیمی) هزینه ارسال استان/شهر
│   │       ├── ShippingMethodsManager.tsx # روش ارسال + بازه‌های وزنی (ویرایش/حذف)
│   │       ├── TrackingSettingsForm.tsx
│   │       ├── SiteAssetsManager.tsx
│   │       ├── GeneralSettingsForm.tsx # نام/تماس‌ها/آدرس/کدپستی/حداقل سفارش/درباره‌ما/کانال‌های آنباکس
│   │       ├── BackupClient.tsx
│   │       ├── CreateUserForm.tsx
│   │       ├── UserRoleControl.tsx
│   │       ├── OrderStatusControl.tsx  # اتصال خودکار به کسب/بازگشت امتیاز وفاداری
│   │       ├── OrderDeleteButton.tsx
│   │       ├── StartTrackingButton.tsx
│   │       ├── ReviewsManager.tsx
│   │       ├── AdminSupportChat.tsx
│   │       ├── SalesAnalytics.tsx      # نمودار فروش (recharts)
│   │       ├── VisitorAnalyticsDashboard.tsx # پنل آمار بازدیدکنندگان (کارت‌ها/نمودار/زنده/Drill-down)
│   │       ├── AdminInvoiceView.tsx    # نمایش+دانلود PDF فاکتور/برچسب سمت ادمین
│   │       ├── LoyaltySettingsForm.tsx # تنظیمات نرخ کسب/مصرف امتیاز
│   │       ├── LoyaltyTiersManager.tsx # سطوح باشگاه مشتریان (برنزی/نقره‌ای/طلایی/پلاتینی)
│   │       ├── LoyaltyTransactionsTable.tsx # دفتر کل امتیازها + اصلاح دستی
│   │       ├── UnboxingVideoForm.tsx   # افزودن ویدیو (سه لینک همزمان)
│   │       └── UnboxingVideosTable.tsx # تأیید/رد/واریز پاداش/برتر ماه
│   │
│   └── app/
│       ├── layout.tsx                  # لایوت ریشه + AnalyticsTracker + favicon
│       ├── icon.png                    # فاوآیکون سایت
│       ├── globals.css
│       ├── robots.ts
│       ├── sitemap.xml/route.ts        # sitemap دستی با هدر XML صریح (جایگزین sitemap.ts)
│       │
│       ├── (auth)/
│       │   ├── layout.tsx
│       │   ├── auth.css                # اصلاح نسبت ناحیه آبی حالت ورود/ثبت‌نام
│       │   ├── actions.ts              # signIn/signUp بر اساس موبایل + OTP پیامکی
│       │   ├── AuthCard.tsx
│       │   ├── PasswordInput.tsx
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   └── forgot-password/page.tsx
│       │
│       ├── auth/callback/route.ts
│       │
│       ├── (shop)/
│       │   ├── layout.tsx              # هدر+فوتر (بدون نوار فیلتر سراسری)
│       │   ├── shop.css
│       │   ├── page.tsx                # صفحه اصلی: فیلتر بالا + هیرو + ردیف‌های افقی + استوک
│       │   ├── products/page.tsx       # همه محصولات (واکشی کلاینتی)
│       │   ├── products/[slug]/
│       │   │   ├── page.tsx            # + Schema.org قیمت + تب آنباکس + متادیتای سئو + Breadcrumb
│       │   │   └── product-detail.css
│       │   ├── category/[slug]/page.tsx# باکس‌های تصویری زیردسته + فیلتر بدون رفرش + Breadcrumb + پاپ‌آپ توضیحات
│       │   ├── newest/page.tsx         # صفحه‌ی «مشاهده همه» جدیدترین‌ها
│       │   ├── popular/page.tsx        # صفحه‌ی «مشاهده همه» پرطرفدارها
│       │   ├── stock/page.tsx          # صفحه‌ی «مشاهده همه» محصولات استوک
│       │   ├── search/page.tsx
│       │   ├── deals/page.tsx
│       │   ├── unboxing/page.tsx       # گالری آنباکس (سه پلتفرم + سرچ داخلی)
│       │   ├── wishlist/page.tsx
│       │   ├── cart/page.tsx
│       │   ├── checkout/
│       │   │   ├── page.tsx
│       │   │   ├── actions.ts          # createOrderAndPay + مصرف امتیاز
│       │   │   ├── pending-actions.ts  # رزرو/بازیابی/تکمیل پیش‌فاکتور ۲۴ساعته
│       │   │   └── loyalty-actions.ts  # پیش‌نمایش امتیاز قابل مصرف/کسب
│       │   ├── order/[id]/page.tsx
│       │   ├── profile/
│       │   │   ├── page.tsx
│       │   │   ├── actions.ts
│       │   │   ├── loyalty/
│       │   │   │   ├── page.tsx        # کارت امتیاز، سطح، نوار پیشرفت، تاریخچه
│       │   │   │   └── actions.ts
│       │   │   └── orders/
│       │   │       ├── page.tsx
│       │   │       ├── review-actions.ts
│       │   │       └── [id]/page.tsx
│       │   ├── support/
│       │   │   ├── page.tsx
│       │   │   ├── actions.ts
│       │   │   └── [id]/page.tsx
│       │   ├── about/page.tsx
│       │   ├── contact/page.tsx
│       │   ├── faq/page.tsx
│       │   ├── terms/page.tsx
│       │   └── privacy/page.tsx
│       │
│       ├── admin/
│       │   ├── layout.tsx
│       │   ├── admin.css
│       │   ├── shipping-label.css      # استایل چاپ برچسب مرسوله (سایز ثابت ۱۰۰×۱۵۰mm)
│       │   ├── page.tsx
│       │   ├── analytics/page.tsx      # گزارش فروش (سفارش‌ها)
│       │   ├── analytics-visitors/page.tsx # آمار بازدیدکنندگان (ترافیک سایت)
│       │   ├── categories/
│       │   ├── products/
│       │   │   ├── page.tsx            # پوسته‌ی سرور + AdminProductsListClient
│       │   │   ├── new/page.tsx
│       │   │   ├── [id]/edit/page.tsx
│       │   │   ├── actions.ts          # createProduct/update/bulk/copy/quickUpdate/history
│       │   │   └── bulk-actions.ts     # bulkUpdateProducts (ویرایش گروهی)
│       │   ├── banners/
│       │   ├── deals/
│       │   ├── stock/page.tsx          # مدیریت محصولات استوک
│       │   ├── out-of-stock/
│       │   │   ├── page.tsx
│       │   │   └── actions.ts          # restockProduct
│       │   ├── orders/
│       │   │   ├── page.tsx
│       │   │   ├── actions.ts          # + اتصال به کسب/بازگشت امتیاز
│       │   │   └── [id]/
│       │   │       ├── page.tsx        # دکمه چاپ فاکتور + چاپ برچسب مرسوله
│       │   │       ├── invoice/page.tsx
│       │   │       └── shipping-label/page.tsx # برچسب مرسوله جدا (فقط سمت ادمین)
│       │   ├── users/
│       │   ├── shipping/               # (قدیمی) استان/شهر
│       │   ├── shipping-methods/
│       │   │   ├── page.tsx
│       │   │   └── actions.ts          # افزودن/ویرایش/حذف روش و بازه وزنی
│       │   ├── tracking-settings/page.tsx
│       │   ├── site-settings/page.tsx
│       │   ├── settings/
│       │   │   ├── general/page.tsx
│       │   │   ├── backup/page.tsx
│       │   │   └── actions.ts
│       │   ├── finance/
│       │   │   ├── transactions/page.tsx
│       │   │   └── invoices/page.tsx
│       │   ├── reviews/
│       │   ├── support/
│       │   ├── loyalty/                # مدیریت باشگاه مشتریان
│       │   │   ├── settings/page.tsx
│       │   │   ├── tiers/page.tsx
│       │   │   ├── transactions/page.tsx
│       │   │   └── actions.ts
│       │   └── unboxing/               # مدیریت ویدیوهای آنباکس
│       │       ├── page.tsx
│       │       ├── new/page.tsx
│       │       └── actions.ts
│       │
│       └── api/
│           ├── admin/
│           │   ├── upload/route.ts
│           │   ├── backup/route.ts
│           │   ├── products-csv/route.ts   # خروجی CSV محصولات
│           │   └── products-list/route.ts  # واکشی جدول محصولات پنل (بدون رفرش)
│           ├── products-list/route.ts       # واکشی لیست محصولات فروشگاه (بدون رفرش)
│           ├── payment/callback/route.ts    # زرین‌پال + پیامک + کسر موجودی + امتیاز + آمار تبدیل
│           ├── support/upload/route.ts
│           ├── image-proxy/route.ts         # پراکسی تصویر لوگو برای فاکتور (رفع CORS)
│           ├── notifications/route.ts       # دریافت/علامت‌گذاری نوتیفیکیشن داخلی
│           ├── track/
│           │   ├── route.ts                 # ثبت pageview + نشست آماری
│           │   ├── ping/route.ts             # ثبت مدت‌زمان حضور (sendBeacon)
│           │   └── live/route.ts             # بازدیدهای زنده (۵ دقیقه اخیر)
│           ├── admin/analytics/
│           │   ├── report/route.ts           # گزارش کامل آمار بازدید (کارت/نمودار/جداول)
│           │   └── session/[id]/route.ts     # Drill-down یک نشست
│           └── cron/
│               ├── cleanup-analytics/route.ts     # پاکسازی لاگ آمار بالای ۶ ماه
│               ├── expire-loyalty-points/route.ts # انقضای خودکار امتیاز
│               └── loyalty-expiry-reminders/route.ts # یادآوری قبل از انقضا
```

---

## جدول به‌روز دیتابیس (Supabase)

| جدول | کاربرد |
|---|---|
| `profiles` | کاربر + نقش + موجودی امتیاز/کیف پول + سطح باشگاه |
| `addresses` | آدرس‌های کاربر |
| `categories` | دسته‌بندی + زیردسته + تصویر |
| `products` | محصولات + وزن + استوک + تصاویر توضیحات + امتیاز کش‌شده |
| `product_quantity_tiers` | تخفیف پلکانی بر اساس تعداد |
| `product_price_history` | تاریخچه تغییرات قیمت هر محصول |
| `orders` / `order_items` | سفارش‌ها + مبلغ/امتیاز مصرف‌شده |
| `pending_checkouts` | پیش‌فاکتور رزروشده (اعتبار ۲۴ساعته) |
| `banners` | بنر اسلایدی صفحه اصلی |
| `site_settings` | تک‌ردیفی؛ تمام تنظیمات سراسری (شامل کانال‌های آنباکس) |
| `shipping_rates` | (قدیمی) هزینه ارسال استان/شهر |
| `shipping_methods` / `shipping_weight_tiers` | روش‌های ارسال بر اساس بازه وزنی |
| `wishlists` | علاقه‌مندی‌ها |
| `product_reviews` | امتیاز و نظر کاربران |
| `support_tickets` / `support_messages` | پشتیبانی |
| `password_reset_otps` | کد یکبارمصرف بازیابی رمز |
| `loyalty_settings` / `loyalty_tiers` / `loyalty_transactions` | باشگاه مشتریان و امتیازدهی |
| `notifications` | نوتیفیکیشن داخلی کاربر |
| `wallet_transactions` | تراکنش‌های کیف پول (پاداش آنباکس) |
| `unboxing_videos` | ویدیوهای آنباکس (آپارات/یوتیوب/اینستاگرام) |
| `analytics_sessions` / `analytics_pageviews` / `analytics_conversions` / `analytics_daily_summary` | آمار بازدیدکنندگان اختصاصی |

---

## پکیج‌های کلیدی نصب‌شده
`@supabase/supabase-js`, `@supabase/ssr`, `zustand`, `@aws-sdk/client-s3`, `sharp`, `zarinpal-checkout`, `jspdf`, `html2canvas-pro`, `jsbarcode`, `recharts`, `lucide-react`, `motion`

---

## فایل‌های منسوخ‌شده (نگه‌داشته ولی دیگر در جریان کد استفاده نمی‌شوند)
- `src/lib/ratings.ts` — امتیاز اکنون مستقیم از ستون `rating_avg`/`rating_count` روی خود محصول خوانده می‌شود.
- `src/components/admin/AdminProductFilters.tsx` — جای خود را به `AdminProductsListClient.tsx` داده.
- `src/components/shop/CategoryNavBar.tsx` — از layout حذف شده.
- `src/app/(auth)/reset-password/page.tsx` — با جریان بازیابی رمز مبتنی بر OTP پیامکی جایگزین شده.

---

## دو کامپوننت جدید این نوبت (آماده، منتظر وصل‌شدن)
- `src/components/shop/Breadcrumb.tsx` — نمایش «خانه / دسته / زیردسته / محصول» با پشتیبانی تم روشن/تیره
- `src/components/shop/DescriptionModal.tsx` — دکمه‌ی «توضیحات» + پاپ‌آپ با سایز ثابت و اسکرول داخلی برای تمام توضیحات طولانی سایت
