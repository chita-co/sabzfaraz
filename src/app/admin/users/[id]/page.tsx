// src/app/admin/users/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import UserRoleControl from "@/components/admin/UserRoleControl";
import SendIdentitySmsButton from "@/components/admin/SendIdentitySmsButton";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [{ data: profile }, { data: addresses }, { data: orders }, { data: authUser }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("addresses").select("*").eq("user_id", id),
      supabase
        .from("orders")
        .select("id, order_number, total_amount, status, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      adminClient.auth.admin.getUserById(id),
    ]);

  if (!profile) notFound();

   let documentUrl: string | null = null;
  if (profile.id_document_path) {
    const { data: signed } = await adminClient.storage
      .from("id-documents")
      .createSignedUrl(profile.id_document_path, 600); // ۱۰ دقیقه اعتبار
    documentUrl = signed?.signedUrl ?? null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">
          اطلاعات کاربر: {profile.full_name}
        </h1>
        {!profile.identity_verified && (
          <SendIdentitySmsButton
            userId={profile.id}
            lastSentAt={profile.identity_sms_sent_at ?? null}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="admin-card">
          <h2 className="font-bold text-gray-800 mb-3">اطلاعات حساب</h2>
          <p className="text-sm text-gray-700 mb-1">
            ایمیل: {authUser?.user?.email ?? "—"}
          </p>
          <p className="text-sm text-gray-700 mb-1">تلفن: {profile.phone ?? "—"}</p>
          <p className="text-sm text-gray-700 mb-1">کد ملی: {profile.national_id ?? "—"}</p>
          <p className="text-sm text-gray-700 mb-1">
            نوع ثبت‌نام:{" "}
            {profile.signup_method === "QUICK"
              ? "سریع"
              : profile.signup_method === "IMAGE"
                ? "با تصویر مدرک"
                : "عادی"}
          </p>
          <p className="text-sm mb-1">
            وضعیت احراز هویت:{" "}
            {profile.identity_verified ? (
              <span className="font-bold text-green-700">✅ احراز شده</span>
            ) : (
              <span className="font-bold text-red-600">⚠️ احراز نشده</span>
            )}
          </p>
          <p className="text-sm text-gray-700 mb-3">
            تاریخ عضویت: {new Date(profile.created_at).toLocaleDateString("fa-IR")}
          </p>
          <UserRoleControl userId={profile.id} currentRole={profile.role} />
        </div>

        <div className="admin-card">
          <h2 className="font-bold text-gray-800 mb-3">آدرس‌های ثبت‌شده</h2>
          {addresses && addresses.length > 0 ? (
            addresses.map((a) => (
              <div
                key={a.id}
                className="text-sm text-gray-700 mb-3 pb-3 border-b last:border-0"
              >
                <p className="font-medium">
                  {a.full_name} — {a.phone}
                </p>
                <p>
                  {a.province} - {a.city}
                </p>
                <p>{a.address_line}</p>
                <p>کد پستی: {a.postal_code}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">هنوز آدرسی ثبت نکرده است.</p>
          )}
        </div>

        <div className="admin-card">
          <h2 className="font-bold text-gray-800 mb-3">سفارش‌ها</h2>
          {orders && orders.length > 0 ? (
            orders.map((o) => (
              <div
                key={o.id}
                className="text-sm text-gray-700 mb-2 pb-2 border-b last:border-0"
              >
                <p dir="ltr" className="text-left">
                  {o.order_number}
                </p>
                <p>{o.total_amount.toLocaleString("fa-IR")} تومان</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">هنوز سفارشی ثبت نکرده است.</p>
          )}
          {profile.id_document_path && (
          <div className="admin-card lg:col-span-3">
            <h2 className="font-bold text-gray-800 mb-3">تصویر مدرک هویتی (کارت ملی / گواهینامه)</h2>
            {documentUrl ? (
              <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={documentUrl}
                  alt="مدرک هویتی کاربر"
                  className="max-w-full max-h-96 rounded border"
                />
              </a>
            ) : (
              <p className="text-sm text-gray-500">خطا در بارگذاری تصویر مدرک.</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              این لینک ۱۰ دقیقه اعتبار دارد؛ با رفرش صفحه، لینک جدید ساخته می‌شود.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}