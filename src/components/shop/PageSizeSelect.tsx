"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS = [20, 50, 100];

export default function PageSizeSelect({ theme = "light" }: { theme?: "light" | "dark" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("pageSize") ?? "20";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  }

  return (
    <select
      key={searchParams.toString()}
      defaultValue={current}
      onChange={(e) => handleChange(e.target.value)}
      className={theme === "dark" ? "page-size-select page-size-select-dark" : "page-size-select"}
    >
      {OPTIONS.map((n) => (
        <option key={n} value={n}>{n.toLocaleString("fa-IR")} محصول در صفحه</option>
      ))}
    </select>
  );
}