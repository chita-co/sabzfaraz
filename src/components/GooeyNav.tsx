"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import ShinyText from "@/components/ShinyText";
import "./GooeyNav.css";

export interface GooeyNavChildItem {
  label: string;
  href: string;
  children?: GooeyNavChildItem[];
}

export interface GooeyNavItem {
  label: string;
  href?: string;
  type?: "link" | "dropdown";
  children?: GooeyNavChildItem[];
  shiny?: boolean;
}

export default function GooeyNav({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10] as [number, number],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0,
}: {
  items: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  // ===== منطق منوی کشویی/مگامنوی دسته‌بندی‌ها =====
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRefs = useRef<(HTMLLIElement | null)[]>([]);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // به‌جای بستن فوری با mouseleave، یک تأخیر کوتاه می‌گذاریم تا اگر موس در همان لحظه
  // به سمت پنل باز‌شده حرکت کند (حتی از میان فاصله‌ی خالی بین دکمه و پنل)، بسته نشود
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => setOpenDropdownIndex(null), 220);
  }, [cancelClose]);

  const openDropdownAt = useCallback((index: number) => {
    cancelClose();
    const el = triggerRefs.current[index];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // موقعیت با position:fixed و بر اساس فاصله از لبه‌ی راست صفحه محاسبه می‌شود
    // (سازگار با راست‌چین بودن سایت) و کاملاً مستقل از overflow والدهای هدر —
    // یعنی در هر عرضی از صفحه به‌درستی باز می‌شود
    setDropdownPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    setOpenDropdownIndex(index);
  }, [cancelClose]);

  const closeDropdownNow = useCallback(() => {
    cancelClose();
    setOpenDropdownIndex(null);
  }, [cancelClose]);

  // برای جلوگیری از نادرست‌شدن موقعیت، با اسکرول یا تغییر اندازه‌ی صفحه پنل بسته می‌شود
  useEffect(() => {
    if (openDropdownIndex === null) return;
    const index = openDropdownIndex;
    function reposition() {
      const el = triggerRefs.current[index];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    }
    function handleResize() {
      closeDropdownNow();
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [openDropdownIndex, closeDropdownNow]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  // در صورت ناوبری واقعی به صفحه‌ی دیگر (تغییر initialActiveIndex از سمت والد)، پیل فعال هم‌گام شود
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveIndex(initialActiveIndex);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialActiveIndex]);

  // تولید مقادیر تصادفی فقط یک‌بار (با useState و lazy initializer)
  const [randomValues] = useState(() => {
    const noiseValues: number[] = [];
    const colorIndices: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      noiseValues.push(Math.random());
      colorIndices.push(Math.floor(Math.random() * colors.length));
    }
    return { noiseValues, colorIndices };
  });

  const noise = (i: number, n = 1) => n / 2 - randomValues.noiseValues[i] * n;

  const getXY = (
    distance: number,
    pointIndex: number,
    totalPoints: number,
    noiseIndex: number
  ): [number, number] => {
    const angle =
      ((360 + noise(noiseIndex, 8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i: number, t: number, d: [number, number], r: number) => {
    const rotate = noise(i, r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount, i),
      end: getXY(d[1] + noise(i, 7), particleCount - i, particleCount, i),
      time: t,
      scale: 1 + noise(i, 0.2),
      color: colors[randomValues.colorIndices[i]],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = (element: HTMLElement) => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty("--time", `${bubbleTime}ms`);

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(i, timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove("active");
      setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add("particle");
        particle.style.setProperty("--start-x", `${p.start[0]}px`);
        particle.style.setProperty("--start-y", `${p.start[1]}px`);
        particle.style.setProperty("--end-x", `${p.end[0]}px`);
        particle.style.setProperty("--end-y", `${p.end[1]}px`);
        particle.style.setProperty("--time", `${p.time}ms`);
        particle.style.setProperty("--scale", `${p.scale}`);
        particle.style.setProperty("--color", `var(--color-${p.color}, white)`);
        particle.style.setProperty("--rotate", `${p.rotate}deg`);

        point.classList.add("point");
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add("active");
        });
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {
            // Do nothing
          }
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    const liEl = e.currentTarget.parentElement as HTMLElement;
    if (activeIndex === index) return;

    setActiveIndex(index);
    updateEffectPosition(liEl);

    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll(".particle");
      particles.forEach((p) => filterRef.current!.removeChild(p));
    }
    if (textRef.current) {
      textRef.current.classList.remove("active");
      void textRef.current.offsetWidth;
      textRef.current.classList.add("active");
    }
    if (filterRef.current) makeParticles(filterRef.current);
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll("li")[activeIndex] as
      | HTMLElement
      | undefined;
    if (activeLi) {
      updateEffectPosition(activeLi);
      textRef.current?.classList.add("active");
    }
    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll("li")[
        activeIndex
      ] as HTMLElement | undefined;
      if (currentActiveLi) updateEffectPosition(currentActiveLi);
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  function renderDropdownContent(item: GooeyNavItem) {
    const hasMegaGroups = !!item.children?.some((c) => c.children && c.children.length > 0);
    if (hasMegaGroups) {
      return (
        <div className="gooey-mega-grid">
          {item.children!.map((group) => (
            <div key={group.href} className="gooey-mega-group">
              <Link href={group.href} className="gooey-mega-group-title" onClick={closeDropdownNow}>
                {group.label}
              </Link>
              {group.children && group.children.length > 0 && (
                <div className="gooey-mega-sublist">
                  {group.children.map((sub) => (
                    <Link key={sub.href} href={sub.href} onClick={closeDropdownNow}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    return (
      <>
        {item.children?.map((child) => (
          <Link key={child.href} href={child.href} onClick={closeDropdownNow}>
            {child.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => {
            const type = item.type ?? "link";

            if (type === "dropdown") {
              const isOpen = openDropdownIndex === index;
              const hasMegaGroups = !!item.children?.some((c) => c.children && c.children.length > 0);
              return (
                <li
                  key={index}
                  ref={(el) => { triggerRefs.current[index] = el; }}
                  className={`dropdown-item${activeIndex === index ? " active" : ""}${isOpen ? " open" : ""}`}
                  onMouseEnter={() => openDropdownAt(index)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    className="gooey-dropdown-trigger"
                    onClick={() => (isOpen ? closeDropdownNow() : openDropdownAt(index))}
                  >
                    {item.label} <ChevronDown size={14} />
                  </button>

                  {mounted && isOpen && dropdownPos && item.children && item.children.length > 0 &&
                    createPortal(
                      <div
                        className={hasMegaGroups ? "gooey-mega-menu" : "gooey-dropdown-menu"}
                        style={{ position: "fixed", top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
                        onMouseEnter={cancelClose}
                        onMouseLeave={scheduleClose}
                      >
                        {renderDropdownContent(item)}
                      </div>,
                      document.body
                    )}
                </li>
              );
            }

            return (
              <li key={index} className={activeIndex === index ? "active" : ""}>
                <Link href={item.href!} onClick={(e) => handleClick(e, index)}>
                  {item.shiny ? (
                    <ShinyText
                      text={item.label}
                      color={activeIndex === index ? "#14532d" : "#ffffff"}
                      shineColor="#fde047"
                      speed={4}
                      spread={40}
                      className="gooey-shiny-item"
                    />
                  ) : (
                    item.label
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <span className="effect filter" ref={filterRef} />
      <span className="effect text" ref={textRef} />
    </div>
  );
}