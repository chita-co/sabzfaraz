"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { applyBubbleDeal, endBubbleDeal } from "@/app/admin/bubble-deals/actions";
import { formatBubbleRemaining, toEnDigits } from "@/lib/bubble/format";

export type AdminProduct = {
  id: string;
  name: string;
  images: string[] | null;
  price: number;
  category_id: string | null;
  discount_price: number | null;
  flash_price: number | null;
  flash_ends_at: string | null;
  flash_applied: boolean;
};

export type AdminCategory = { id: string; name: string; parent_id: string | null };

const PRESETS = [
  { label: "۳۰ دقیقه", value: 30 },
  { label: "۱ ساعت", value: 60 },
  { label: "۲ ساعت", value: 120 },
  { label: "۳ ساعت", value: 180 },
  { label: "۶ ساعت", value: 360 },
  { label: "۱۲ ساعت", value: 720 },
  { label: "۲۴ ساعت", value: 1440 },
  { label: "۴۸ ساعت", value: 2880 },
];

function buildCategoryOptions(cats: AdminCategory[]) {
  const ids = new Set(cats.map((c) => c.id));
  const childrenOf = new Map<string | null, AdminCategory[]>();
  for (const c of cats) {
    const key = c.parent_id && ids.has(c.parent_id) ? c.parent_id : null;
    childrenOf.set(key, [...(childrenOf.get(key) ?? []), c]);
  }
  const out: { id: string; label: string }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const c of childrenOf.get(parent) ?? []) {
      out.push({ id: c.id, label: `${"— ".repeat(depth)}${c.name}` });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

function collectDescendants(cats: AdminCategory[], rootId: string) {
  const set = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of cats) {
      if (c.parent_id && set.has(c.parent_id) && !set.has(c.id)) {
        set.add(c.id);
        grew = true;
      }
    }
  }
  return set;
}

const digitsOnly = (s: string) => Number(toEnDigits(s).replace(/\D/g, "")) || 0;

export default function BubbleDealsAdmin({
  products,
  categories,
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priceText, setPriceText] = useState("");
  const [presetMinutes, setPresetMinutes] = useState(60);
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const scope = useMemo(
    () => (categoryId === "all" ? null : collectDescendants(categories, categoryId)),
    [categories, categoryId]
  );

  const q = search.trim().toLowerCase();

  const candidates = useMemo(
    () =>
      products.filter(
        (p) =>
          !p.flash_applied &&
          (!scope || (p.category_id !== null && scope.has(p.category_id))) &&
          (!q || p.name.toLowerCase().includes(q))
      ),
    [products, scope, q]
  );

  const shown = candidates.slice(0, 80);
  const active = products.filter((p) => p.flash_applied);
  const selected = products.find((p) => p.id === selectedId) ?? null;

  const price = digitsOnly(priceText);
  const manualTotal = digitsOnly(manualHours) * 60 + digitsOnly(manualMinutes);
  const minutes = manualTotal > 0 ? manualTotal : presetMinutes;

  function submit() {
    setMessage(null);
    if (!selected) return setMessage({ type: "err", text: "ابتدا یک محصول انتخاب کنید." });
    if (price <= 0) return setMessage({ type: "err", text: "قیمت حبابی را وارد کنید." });
    if (price >= selected.price) return setMessage({ type: "err", text: "قیمت حبابی باید کمتر از قیمت اصلی باشد." });
    if (minutes < 5) return setMessage({ type: "err", text: "حداقل مدت تایمر ۵ دقیقه است." });

    startTransition(async () => {
      const res = await applyBubbleDeal(selected.id, price, minutes);
      if ("error" in res) {
        setMessage({ type: "err", text: res.error });
        return;
      }
      setMessage({ type: "ok", text: "حباب ارزانی ثبت شد و محصول به صفحه حباب ارزانی اضافه شد." });
      setSelectedId(null);
      setPriceText("");
      setManualHours("");
      setManualMinutes("");
      router.refresh();
    });
  }

  function stop(id: string) {
    if (!window.confirm("حباب ارزانی این محصول زودتر پایان یابد؟ قیمت اصلی برمی‌گردد.")) return;
    startTransition(async () => {
      await endBubbleDeal(id);
      router.refresh();
    });
  }

  const minutesLabel = `${Math.floor(minutes / 60).toLocaleString("fa-IR")} ساعت و ${(minutes % 60).toLocaleString("fa-IR")} دقیقه`;

  return (
    <div dir="rtl" className="space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">🫧 مدیریت حباب ارزانی</h1>
        <p className="mt-1 text-sm text-gray-500">
          دسته‌بندی را انتخاب کنید یا جستجو کنید، محصول را انتخاب کنید، سپس قیمت حبابی و مدت تایمر را وارد کنید.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border p-4">
          <h2 className="font-bold">ثبت حباب جدید</h2>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="all">همه دسته‌بندی‌ها</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام محصول..."
            className="w-full rounded-lg border px-3 py-2"
          />

          <div className="max-h-120 divide-y overflow-y-auto rounded-lg border">
            {shown.map((p) => {
              const big = q.length > 0;
              const size = big ? 80 : 52;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-center gap-3 p-2 text-right hover:bg-gray-50 ${
                    p.id === selectedId ? "bg-cyan-50" : ""
                  }`}
                >
                  <div
                    className="shrink-0 overflow-hidden rounded-lg border bg-white"
                    style={{ width: size, height: size }}
                  >
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        width={size}
                        height={size}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[10px] text-gray-400">بدون عکس</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${big ? "text-base font-semibold" : "text-sm"}`}>{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.category_id ? categoryNames.get(p.category_id) : ""} · {p.price.toLocaleString("fa-IR")} تومان
                    </p>
                  </div>
                </button>
              );
            })}
            {shown.length === 0 && <p className="p-3 text-sm text-gray-500">محصولی پیدا نشد.</p>}
          </div>

          {selected && (
            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg border bg-white">
                  {selected.images?.[0] && (
                    <Image src={selected.images[0]} alt={selected.name} width={112} height={112} className="h-full w-full object-contain" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm">قیمت اصلی: {selected.price.toLocaleString("fa-IR")} تومان</p>
                </div>
              </div>

              <label className="block text-sm">
                قیمت حبابی (تومان)
                <input
                  inputMode="numeric"
                  value={priceText}
                  onChange={(e) =>
                    setPriceText(
                      toEnDigits(e.target.value)
                        .replace(/\D/g, "")
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    )
                  }
                  placeholder="مثلاً ۱۲۰۰۰۰۰"
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>

              <div className="space-y-2 text-sm">
                <p className="font-semibold">مدت تایمر</p>
                <select
                  value={presetMinutes}
                  onChange={(e) => setPresetMinutes(Number(e.target.value))}
                  disabled={manualTotal > 0}
                  className="w-full rounded-lg border px-3 py-2 disabled:opacity-50"
                >
                  {PRESETS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>

                <p className="pt-1 text-xs text-gray-500">یا زمان دلخواه را دستی وارد کنید:</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs">
                    ساعت
                    <input
                      inputMode="numeric"
                      value={manualHours}
                      onChange={(e) => setManualHours(toEnDigits(e.target.value).replace(/\D/g, ""))}
                      placeholder="مثلاً ۵"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                  <label className="text-xs">
                    دقیقه
                    <input
                      inputMode="numeric"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(toEnDigits(e.target.value).replace(/\D/g, ""))}
                      placeholder="مثلاً ۳۰"
                      className="mt-1 w-full rounded-lg border px-3 py-2"
                    />
                  </label>
                </div>
                <p className="text-xs text-cyan-700">
                  مدت ثبت‌شده: {minutesLabel}
                  {manualTotal > 0 ? " (زمان دستی فعال است)" : ""}
                </p>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={submit}
                className="w-full rounded-xl bg-linear-to-l from-cyan-500 to-pink-500 py-2.5 font-bold text-white disabled:opacity-50"
              >
                {isPending ? "در حال ثبت..." : "ثبت حباب ارزانی"}
              </button>
            </div>
          )}

          {message && (
            <p className={message.type === "ok" ? "text-sm text-green-600" : "text-sm text-red-600"}>
              {message.text}
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border p-4">
          <h2 className="font-bold">حباب‌های فعال ({active.length.toLocaleString("fa-IR")})</h2>
          {active.length === 0 && <p className="text-sm text-gray-500">هیچ حبابی فعال نیست.</p>}

          {active.map((p) => {
            const remaining = now !== null && p.flash_ends_at ? new Date(p.flash_ends_at).getTime() - now : null;
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border p-3">
                {p.images?.[0] && (
                  <Image src={p.images[0]} alt="" width={56} height={56} className="rounded object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs">
                    <span className="text-gray-400 line-through">{p.price.toLocaleString("fa-IR")}</span>
                    {" → "}
                    <b className="text-pink-600">{(p.flash_price ?? 0).toLocaleString("fa-IR")}</b>
                  </p>
                  <p className="font-mono text-xs text-cyan-700" dir="ltr">
                    {remaining === null
                      ? "--:--:--"
                      : remaining > 0
                      ? formatBubbleRemaining(remaining)
                      : "تمام شد (با رفرش پاک می‌شود)"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => stop(p.id)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600"
                >
                  پایان
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}