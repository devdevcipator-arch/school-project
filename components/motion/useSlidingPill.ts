"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Platform-wide navigation animation ("sliding pill").
 * A pill indicator glides to the hovered/focused item and returns to the active one.
 * Works for horizontal and vertical lists (nav bars, mobile menus, tabs, sidebars).
 *
 * Usage: put `ref={listRef}` on a `relative` list, render
 * <span data-pill aria-hidden className={pillClass} /> inside it, mark each item
 * with `data-pill-item`, and call setHover(i | null) on hover/focus.
 */
export function useSlidingPill(activeIndex: number) {
  const listEl = useRef<HTMLElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const target = hover ?? activeIndex;
  const targetRef = useRef(target);

  const place = useCallback(() => {
    const list = listEl.current;
    if (!list) return;
    const pill = list.querySelector<HTMLElement>("[data-pill]");
    const el = list.querySelectorAll<HTMLElement>("[data-pill-item]")[targetRef.current];
    if (!el || !pill) return;
    pill.style.width = `${el.offsetWidth}px`;
    pill.style.height = `${el.offsetHeight}px`;
    pill.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
    pill.style.opacity = "1";
  }, []);

  const listRef = useCallback(
    (el: HTMLElement | null) => {
      listEl.current = el;
      place();
    },
    [place],
  );

  useLayoutEffect(() => {
    targetRef.current = target;
    place();
  }, [target, place]);

  useEffect(() => {
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [place]);

  return { listRef, target, setHover };
}

/** Shared pill styling so every nav/tab in the platform looks and moves the same. */
export const pillClass =
  "pointer-events-none absolute left-0 top-0 rounded-full bg-linear-135 from-primary via-accent to-primary bg-[length:220%_100%] opacity-0 shadow-[0_6px_18px_rgba(29,84,109,.45)] transition-[transform,width,height,opacity] duration-[450ms] ease-nav";
