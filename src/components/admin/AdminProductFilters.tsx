"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Category } from "@/types";

export default function AdminProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", q);
  }

  return (
    <div className="admin-filters-bar">
      <form onSubmit={handleSearchSubmit} className="admin-filters-search">
        <Search size={15} />
        <input
          type="text"
          placeholder="جستجو در نام یا کد محصول..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="admin-filters-apply-btn">اعمال</button>
      </form>

      <select
        defaultValue={searchParams.get("category") ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
        className="admin-input"
      >
        <option value="">همه دسته‌بندی‌ها</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="admin-input"
      >
        <option value="">همه وضعیت‌ها</option>
        <option value="active">فعال</option>
        <option value="inactive">غیرفعال</option>
        <option value="low-stock">موجودی کم (کمتر از ۵)</option>
      </select>

      <select
        defaultValue={searchParams.get("pageSize") ?? "20"}
        onChange={(e) => updateParam("pageSize", e.target.value)}
        className="admin-input"
      >
        <option value="20">۲۰ محصول در صفحه</option>
        <option value="50">۵۰ محصول در صفحه</option>
        <option value="100">۱۰۰ محصول در صفحه</option>
      </select>
    </div>
  );
}