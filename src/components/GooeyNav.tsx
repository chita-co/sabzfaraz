"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import ShinyText from "@/components/ShinyText";
import "./GooeyNav.css";

export interface GooeyNavChildItem {
  label: string;
  href: string;
}

export interface GooeyNavItem {
  label: string;
  href?: string;
  type?: "link" | "dropdown";
  children?: GooeyNavChildItem[];
  /** اگر true باشد، متن آیتم با افکت درخشش ملایم (ShinyText) رندر می‌شود */
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
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);

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

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => {
            const type = item.type ?? "link";

            if (type === "dropdown") {
              const isOpen = openDropdownIndex === index;
              return (
                <li
                  key={index}
                  className={`dropdown-item${activeIndex === index ? " active" : ""}${isOpen ? " open" : ""}`}
                  onMouseEnter={() => setOpenDropdownIndex(index)}
                  onMouseLeave={() => setOpenDropdownIndex((cur) => (cur === index ? null : cur))}
                >
                  <button
                    type="button"
                    className="gooey-dropdown-trigger"
                    onClick={() => setOpenDropdownIndex((cur) => (cur === index ? null : index))}
                  >
                    {item.label} <ChevronDown size={14} />
                  </button>
                  {isOpen && item.children && item.children.length > 0 && (
                    <div className="gooey-dropdown-menu">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
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