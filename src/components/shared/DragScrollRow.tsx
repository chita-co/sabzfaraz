"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function DragScrollRow({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    // فقط ماوس؛ لمس با انگشت خودش اسکرول افقی دارد
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        el.classList.add("is-dragging");
      }
      if (moved) el.scrollLeft = startScroll - dx;
    };

    const onPointerUp = () => {
      isDown = false;
      el.classList.remove("is-dragging");
    };

    // اگر بعد از درگ کلیک شد، لینک یا دکمه اجرا نشود
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("click", onClickCapture, true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}