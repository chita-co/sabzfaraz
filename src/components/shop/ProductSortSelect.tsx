"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const options = [
  { value: "newest", label: "جدیدترین" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
];

export default function ProductSortSelect({ basePath }: { basePath?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const target = basePath ?? pathname;
  const isSamePage = target === pathname;
  const currentSort = isSamePage ? (searchParams.get("sort") ?? "newest") : "newest";

  function handleChange(value: string) {
    const params = isSamePage ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    params.set("sort", value);
    params.delete("page");
    router.push(`${target}?${params.toString()}`);
  }

  return (
    <select value={currentSort} onChange={(e) => handleChange(e.target.value)} className="sort-select">
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}