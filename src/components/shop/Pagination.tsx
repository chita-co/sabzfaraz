import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function Pagination({
  basePath,
  currentPage,
  totalPages,
  extraParams = {},
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  extraParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams(extraParams);
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <div className="pagination-bar">
      <Link
        href={buildUrl(Math.max(1, currentPage - 1))}
        className={`pagination-arrow${currentPage <= 1 ? " disabled" : ""}`}
      >
        <ChevronRight size={16} />
      </Link>

      {pages.map((p, i) => (
        <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {i > 0 && pages[i - 1] !== p - 1 && <span className="pagination-dots">...</span>}
          <Link href={buildUrl(p)} className={`pagination-page${p === currentPage ? " active" : ""}`}>
            {p.toLocaleString("fa-IR")}
          </Link>
        </span>
      ))}

      <Link
        href={buildUrl(Math.min(totalPages, currentPage + 1))}
        className={`pagination-arrow${currentPage >= totalPages ? " disabled" : ""}`}
      >
        <ChevronLeft size={16} />
      </Link>
    </div>
  );
}