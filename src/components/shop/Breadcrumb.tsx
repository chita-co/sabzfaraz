import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string; // اگر href نداشته باشد، یعنی صفحه‌ی فعلی است (غیرقابل‌کلیک)
}

export default function Breadcrumb({
  items,
  theme = "light",
}: {
  items: BreadcrumbItem[];
  theme?: "light" | "dark";
}) {
  return (
    <nav className={`breadcrumb-nav${theme === "dark" ? " breadcrumb-nav-dark" : ""}`} aria-label="مسیر صفحه">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link href="/" className="breadcrumb-link">
            <Home size={13} />
            <span>خانه</span>
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="breadcrumb-item">
            <ChevronLeft size={13} className="breadcrumb-sep" />
            {item.href ? (
              <Link href={item.href} className="breadcrumb-link">{item.label}</Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}