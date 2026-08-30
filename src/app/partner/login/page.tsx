import { getCurrentPartner } from "@/lib/partners/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import PartnerAuthForm from "@/components/partner/PartnerAuthForm";
import "../partner.css";

export default async function PartnerLoginPage() {
  const partner = await getCurrentPartner();
  if (partner) redirect("/partner");

  const admin = createAdminClient();
  const { data: categories } = await admin.from("categories").select("id, name").eq("partner_allowed", true).eq("is_active", true).order("name");
  const { data: settings } = await admin.from("partner_settings").select("partner_terms_text, registration_open").eq("id", 1).single();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", padding: 20, direction: "rtl" }}>
      <PartnerAuthForm
        categories={categories ?? []}
        termsText={settings?.partner_terms_text ?? ""}
        registrationOpen={settings?.registration_open ?? true}
      />
    </div>
  );
}