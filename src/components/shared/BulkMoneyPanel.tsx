import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBulkMoney, canPayBalance } from "@/lib/bulkOrder/orderMirror";
import BulkMoneyManager from "@/components/admin/BulkMoneyManager";
import BulkAwaitingActions from "@/components/admin/BulkAwaitingActions";
import BulkBalancePayment from "@/components/shop/BulkBalancePayment";
import BulkRefundDetailsForm from "@/components/shop/BulkRefundDetailsForm";
import BulkRefundAdminActions from "@/components/admin/BulkRefundAdminActions";

type StoreItem = { productName: string; quantity: number; unitPrice: number };
type MarketItem = {
  name: string;
  quantity: number;
  minPrice: number | null;
  maxPrice: number | null;
  finalUnitPrice?: number | null;
};
type BankAcc = {
  id: string;
  bank_name: string;
  account_holder_name: string;
  card_number: string | null;
  sheba_number: string | null;
  logo_slug: string;
};
type InvoiceFields = { final_invoice_html?: string | null; final_invoice_number?: string | null };

const KIND_LABEL: Record<string, string> = {
  DEPOSIT: "بیعانه",
  BALANCE: "واریز مانده / اضافی",
  REFUND: "بازپرداخت به مشتری",
};
const METHOD_LABEL: Record<string, string> = {
  ONLINE: "درگاه آنلاین",
  CARD_TO_CARD: "کارت به کارت",
  WALLET: "کیف پول سایت",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  AWAITING_CONFIRMATION: "در انتظار تأیید",
  PAID: "موفق",
  FAILED: "ناموفق",
  PENDING_DETAILS: "در انتظار ثبت شماره‌ی حساب مشتری",
  AWAITING_PAYOUT: "در انتظار پرداخت توسط فروشگاه",
};

const fa = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `${n.toLocaleString("fa-IR")} تومان`;
const when = (s: string) => new Date(s).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });

export default async function BulkMoneyPanel({
  requestId,
  role,
}: {
  requestId: string;
  role: "ADMIN" | "CUSTOMER";
}) {
  const admin = createAdminClient();
  const [loaded, banksRes] = await Promise.all([
    loadBulkMoney(admin, requestId),
    admin
      .from("bank_accounts")
      .select("id, bank_name, account_holder_name, card_number, sheba_number, logo_slug")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const { request, money, error } = loaded;
  if (error || !request || !money) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6 text-sm text-red-700">
        خطا در بارگذاری اطلاعات مالی سفارش جمعی.
      </div>
    );
  }

  const storeItems = (request.store_items ?? []) as StoreItem[];
  const marketItems = (request.market_items ?? []) as MarketItem[];
  const inv = request as unknown as InvoiceFields;
  const banks = (banksRes.data ?? []) as BankAcc[];
  const depositPaid = money.payments.some((p) => p.kind === "DEPOSIT" && p.status === "PAID");
  const awaitingBalance = money.payments.some(
    (p) => p.kind === "BALANCE" && p.status === "AWAITING_CONFIRMATION"
  );
  const payBlock = canPayBalance(request, money);
  const showPay = role === "CUSTOMER" && payBlock === null;

  let balanceText: string;
  let balanceClass: string;
  if (money.total === null) {
    balanceText = "مبلغ کل نهایی هنوز تعیین نشده است. تا آن زمان فقط بیعانه ثبت شده است.";
    balanceClass = "text-gray-700 bg-gray-50";
  } else if ((money.balance ?? 0) > 0) {
    balanceText =
      role === "ADMIN"
        ? `مبلغ مانده‌ای که باید از مشتری دریافت شود: ${fa(money.balance)}`
        : `مبلغ باقی‌مانده‌ی قابل واریز: ${fa(money.balance)}`;
    balanceClass = "text-red-700 bg-red-50";
  } else if ((money.balance ?? 0) < 0) {
    balanceText = `مبلغ قابل بازپرداخت به مشتری: ${fa(-(money.balance ?? 0))}`;
    balanceClass = "text-blue-700 bg-blue-50";
  } else {
    balanceText = "سفارش به‌طور کامل تسویه شده است.";
    balanceClass = "text-green-700 bg-green-50";
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 mb-6 space-y-5 text-sm text-gray-800">
      <h2 className="font-bold text-base">
        خلاصه‌ی مالی سفارش جمعی <span dir="ltr">{request.request_number}</span>
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">مبلغ کل نهایی</p>
          <p className="font-semibold">{fa(money.total)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">بیعانه</p>
          <p className="font-semibold">
            {fa(request.deposit_amount)} {depositPaid ? "(پرداخت شده)" : "(پرداخت نشده)"}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 col-span-2">
          <p className="text-xs text-gray-500">نحوه‌ی ارسال</p>
          <p className="font-semibold">
            {request.shipping_name ?? "—"} — {fa(request.shipping_cost ?? 0)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">مجموع واریزهای موفق</p>
          <p className="font-semibold">{fa(money.paidIn)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">مجموع بازپرداخت‌ها</p>
          <p className="font-semibold">{fa(money.refunded)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 col-span-2">
          <p className="text-xs text-gray-500">پرداخت خالص مشتری</p>
          <p className="font-semibold">{fa(money.netPaid)}</p>
        </div>
      </div>

      <p className={`rounded-lg p-3 font-medium ${balanceClass}`}>{balanceText}</p>

      {request.balance_note && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          توضیح فروشگاه: {request.balance_note}
        </p>
      )}

      {showPay && <BulkBalancePayment requestId={requestId} balance={money.balance ?? 0} banks={banks} />}
      {role === "CUSTOMER" && awaitingBalance && (
        <p className="text-sm text-amber-700">پرداخت مانده‌ی شما ثبت شده و در انتظار تأیید است.</p>
      )}

      <div>
        <h3 className="font-semibold mb-2">ریز هزینه‌ها</h3>
        <table className="w-full text-right text-xs">
          <tbody>
            <tr className="border-b">
              <td className="py-2">هزینه‌ی جمع‌آوری کالاهای بازار</td>
              <td>{fa(request.collection_fee ?? 0)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">نحوه‌ی ارسال: {request.shipping_name ?? "—"}</td>
              <td>{fa(request.shipping_cost ?? 0)}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">این هزینه‌ها همراه بیعانه پرداخت می‌شوند.</p>
      </div>

      {storeItems.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">اقلام فروشگاه</h3>
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">کالا</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>جمع</th>
              </tr>
            </thead>
            <tbody>
              {storeItems.map((it, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{it.productName}</td>
                  <td>{it.quantity}</td>
                  <td>{fa(it.unitPrice)}</td>
                  <td>{fa(it.unitPrice * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {marketItems.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">اقلام بازار</h3>
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">کالا</th>
                <th>تعداد</th>
                <th>بازه‌ی قیمت</th>
                <th>قیمت نهایی واحد</th>
                <th>جمع نهایی</th>
              </tr>
            </thead>
            <tbody>
              {marketItems.map((it, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{it.name}</td>
                  <td>{it.quantity}</td>
                  <td>
                    {it.minPrice !== null && it.maxPrice !== null
                      ? `${it.minPrice.toLocaleString("fa-IR")} تا ${it.maxPrice.toLocaleString("fa-IR")}`
                      : "—"}
                  </td>
                  <td>{it.finalUnitPrice ? fa(it.finalUnitPrice) : "—"}</td>
                  <td>{it.finalUnitPrice ? fa(it.finalUnitPrice * it.quantity) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">تاریخچه‌ی پرداخت‌ها</h3>
        {money.payments.length === 0 ? (
          <p className="text-gray-500">هنوز پرداختی ثبت نشده است.</p>
        ) : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">تاریخ</th>
                <th>نوع</th>
                <th>روش</th>
                <th>مبلغ</th>
                <th>وضعیت</th>
                <th>شماره پیگیری</th>
              </tr>
            </thead>
            <tbody>
              {money.payments.map((p) => (
                <tr key={p.id} className="border-b align-top">
                  <td className="py-2">{when(p.created_at)}</td>
                  <td>{KIND_LABEL[p.kind]}</td>
                  <td>{METHOD_LABEL[p.method] ?? p.method}</td>
                  <td>{fa(p.amount)}</td>
                  <td>
                    {STATUS_LABEL[p.status] ?? p.status}
                    {role === "ADMIN" && p.payment_error && (
                      <span className="block text-red-600">خطا: {p.payment_error}</span>
                    )}
                    {role === "ADMIN" && p.kind === "BALANCE" && p.status === "AWAITING_CONFIRMATION" && (
                      <BulkAwaitingActions paymentId={p.id} />
                    )}
                    {role === "CUSTOMER" && p.kind === "REFUND" && p.status === "PENDING_DETAILS" && (
                      <BulkRefundDetailsForm
                        paymentId={p.id}
                        method={p.method}
                        amount={p.amount}
                      />
                    )}
                    {role === "ADMIN" && p.kind === "REFUND" && p.status === "AWAITING_PAYOUT" && (
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <p>نام صاحب حساب: {p.payout_holder_name}</p>
                        <p dir="ltr">
                          {p.method === "SHEBA" ? `شبا: ${p.payout_sheba}` : `کارت: ${p.payout_card_number}`}
                        </p>
                        <BulkRefundAdminActions paymentId={p.id} />
                      </div>
                    )}
                  </td>
                  <td dir="ltr">{p.sep_ref_num ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {inv.final_invoice_html ? (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold">
              فاکتور نهایی{" "}
              {inv.final_invoice_number && <span dir="ltr">{inv.final_invoice_number}</span>}
            </h3>
            {role === "ADMIN" && (
              <Link href={`/admin/bulk-orders/${requestId}/invoice-builder`} className="admin-btn admin-btn-secondary">
                ویرایش فاکتور
              </Link>
            )}
          </div>
          <iframe
            title="فاکتور نهایی سفارش جمعی"
            srcDoc={inv.final_invoice_html}
            sandbox=""
            className="h-700px w-full rounded border border-gray-200 bg-white"
          />
        </div>
      ) : (
        role === "ADMIN" && (
          <Link href={`/admin/bulk-orders/${requestId}/invoice-builder`} className="admin-btn admin-btn-primary">
            ساخت فاکتور نهایی
          </Link>
        )
      )}

      {role === "ADMIN" && <BulkMoneyManager requestId={requestId} currentTotal={money.total} />}
    </section>
  );
}