import { redirect } from "next/navigation";
import { getMyWalletData } from "./actions";
import WalletClient from "@/components/shop/WalletClient";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GrainientBackground from "@/components/backgrounds/GrainientBackground";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const data = await getMyWalletData();
  if (!data) redirect("/login");

  return (
    <>
      <GrainientBackground />
      <div className="mx-auto max-w-2xl px-4 py-10 relative z-10">
        <Breadcrumb theme="light" items={[{ label: "پروفایل من", href: "/profile" }, { label: "کیف پول" }]} />
        <WalletClient
          balance={data.balance}
          transactions={data.transactions}
          pendingRequests={data.pendingRequests}
          minTopup={data.minTopup}
          maxTopup={data.maxTopup}
          manualTopupEnabled={data.manualTopupEnabled}
          bankAccounts={data.bankAccounts}
        />
      </div>
    </>
  );
}