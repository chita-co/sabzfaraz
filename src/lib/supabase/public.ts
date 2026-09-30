import { createClient } from "@supabase/supabase-js";

// کلاینت بدون کوکی؛ فقط برای داده‌های عمومی که داخل unstable_cache خوانده می‌شود
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}