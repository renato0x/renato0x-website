"use client";

import { useEffect, useRef } from "react";

const cursorQuery = "(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)";

export function PortfolioCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const point = cursor.firstElementChild as HTMLElement;
    const ring = cursor.lastElementChild as HTMLElement;
    const query = window.matchMedia(cursorQuery);
    const root = document.documentElement;
    let x = 0;
    let y = 0;
    let ringX = 0;
    let ringY = 0;
    let lastTime = 0;
    let frame = 0;

    const hide = () => {
      delete root.dataset.portfolioCursor;
      delete cursor.dataset.state;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };

    const follow = (time: number) => {
      const elapsed = lastTime ? Math.min(48, time - lastTime) : 16;
      lastTime = time;
      const followRate = 1 - Math.exp(-elapsed / 65);
      ringX += (x - ringX) * followRate;
      ringY += (y - ringY) * followRate;
      ring.style.translate = `${ringX}px ${ringY}px`;
      frame = Math.abs(x - ringX) + Math.abs(y - ringY) > 0.15 ? requestAnimationFrame(follow) : 0;
    };

    const move = (event: PointerEvent) => {
      const target = event.target;
      if (!query.matches || event.pointerType !== "mouse" || !(target instanceof Element) ||
          target.closest("input, textarea, select, [contenteditable]:not([contenteditable=false]), [draggable=true]") ||
          (event.buttons && document.getSelection()?.type === "Range")) {
        hide();
        return;
      }

      const interactive = target.closest("a, button, .stack-item, [role=button]");
      if (!interactive && target.closest("p, h1, h2, h3, .profile-name-wrap, .project-copy, .music-info")) {
        hide();
        return;
      }

      x = event.clientX;
      y = event.clientY;
      if (!cursor.dataset.state) {
        root.dataset.portfolioCursor = "active";
        ringX = x;
        ringY = y;
      }
      const state = interactive?.classList.contains("project-card") ? "card"
        : interactive?.classList.contains("avatar-preview-trigger") ? "avatar"
        : interactive ? "control" : "default";
      if (cursor.dataset.state !== state) cursor.dataset.state = state;
      point.style.translate = `${x}px ${y}px`;
      if (!frame) frame = requestAnimationFrame(follow);
    };

    const hideOnTouch = (event: PointerEvent) => { if (event.pointerType !== "mouse") hide(); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", hideOnTouch, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    query.addEventListener("change", hide);
    return () => {
      hide();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", hideOnTouch);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
      query.removeEventListener("change", hide);
    };
  }, []);

  return <div ref={cursorRef} className="portfolio-cursor" aria-hidden="true"><span /><span /></div>;
}
