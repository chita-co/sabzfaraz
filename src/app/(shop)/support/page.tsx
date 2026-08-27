import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HelpCircle, MessageCircle } from "lucide-react";
import NewTicketButton from "@/components/shop/NewTicketButton";
import FerrofluidBackground from "@/components/backgrounds/FerrofluidBackground";

const statusLabels: Record<string, string> = { OPEN: "باز", CLOSED: "بسته‌شده" };

type UserSupportTicket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_unread: boolean;
};

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tickets } = await supabase.rpc("get_user_support_tickets_with_unread", { p_user_id: user.id });
  const typedTickets = (tickets ?? []) as UserSupportTicket[];

   return (
    <>
      <FerrofluidBackground />
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-bold text-white mb-6">پشتیبانی</h1>

      <Link href="/faq" className="support-faq-banner">
        <HelpCircle size={20} />
        <div>
          <p className="font-bold">ابتدا سوالات متداول را ببینید</p>
          <p className="text-xs opacity-80">شاید پاسخ سوال شما همین‌جا باشد</p>
        </div>
      </Link>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="font-bold text-white">گفتگوهای من</h2>
        <NewTicketButton />
      </div>

      <div className="space-y-3">
        {typedTickets.map((t) => (
          <Link key={t.id} href={`/support/${t.id}`} className="support-ticket-row">
            <div className="support-ticket-icon" style={{ position: "relative" }}>
              <MessageCircle size={18} />
              {t.is_unread && (
                <span style={{ position: "absolute", top: -3, left: -3, width: 9, height: 9, borderRadius: "50%", background: "#dc2626", border: "2px solid #fff" }} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{t.subject}</p>
              <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString("fa-IR")}</p>
            </div>
            <span className={`badge ${t.status === "OPEN" ? "badge-success" : "badge-info"}`}>
              {statusLabels[t.status]}
            </span>
          </Link>
        ))}
        {(!tickets || tickets.length === 0) && (
          <p className="text-white/70 text-sm">هنوز گفتگویی با پشتیبانی ثبت نکرده‌اید.</p>
        )}
      </div>
      </div>
    </>
  );
}