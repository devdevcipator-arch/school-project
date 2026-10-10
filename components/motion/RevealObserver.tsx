"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STAGGER_MS = 90;
const DURATION_MS = 850;

/**
 * Platform-wide section transition ("reveal-up").
 * Mark any element with `data-reveal` and it animates in when scrolled into view.
 * Sibling elements stagger automatically. Re-runs on every route change.
 */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("reveal-ready");
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.removeAttribute("data-reveal"));
      return;
    }

    els.forEach((el) => {
      const siblings = Array.from(el.parentElement?.children ?? []).filter((c) => c.hasAttribute("data-reveal"));
      el.style.setProperty("--d", `${siblings.indexOf(el) * STAGGER_MS}ms`);
    });

    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add("is-visible");
          io.unobserve(el);
          // Once revealed, hand the element back to its own transitions (hover etc.)
          const delay = parseInt(el.style.getPropertyValue("--d"), 10) || 0;
          timers.push(
            window.setTimeout(() => {
              el.removeAttribute("data-reveal");
              el.classList.remove("is-visible");
              el.style.removeProperty("--d");
            }, delay + DURATION_MS),
          );
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [pathname]);

  return null;
}
