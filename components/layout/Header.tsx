"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";
import { mainNav } from "@/lib/site";

const linkClass =
  "relative z-10 block rounded-full px-[18px] py-[9px] text-[.95rem] font-semibold transition-colors duration-[350ms] ease-nav";

export default function Header() {
  const pathname = usePathname();
  const activeIndex = Math.max(0, mainNav.findIndex((l) => l.href === pathname));
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const { listRef: desktopListRef, target: desktopTarget, setHover: setDesktopHover } = useSlidingPill(activeIndex);
  const { listRef: mobileListRef, target: mobileTarget, setHover: setMobileHover } = useSlidingPill(activeIndex);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-[350ms] ${
        scrolled || open
          ? "border-surface/10 bg-ink/70 backdrop-blur-[14px] backdrop-saturate-150"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="shell flex h-[76px] items-center justify-between gap-6">
        <Logo />

        {/* Desktop navigation with sliding pill */}
        <nav aria-label="Main" className="hidden flex-1 items-center lg:flex">
          <ul ref={desktopListRef} className="relative mx-auto flex gap-1" onMouseLeave={() => setDesktopHover(null)}>
            <span data-pill aria-hidden className={pillClass} />
            {mainNav.map((link, i) => (
              <li key={link.href}>
                <Link
                  data-pill-item
                  href={link.href}
                  aria-current={i === activeIndex ? "page" : undefined}
                  onMouseEnter={() => setDesktopHover(i)}
                  onFocus={() => setDesktopHover(i)}
                  onBlur={() => setDesktopHover(null)}
                  className={`${linkClass} ${i === desktopTarget ? "text-surface" : "text-surface/80 hover:text-surface"}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <ButtonLink href="/login" variant="dark">Login</ButtonLink>
            <ButtonLink href="/contact#register">Register School</ButtonLink>
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-11 flex-col items-center justify-center gap-[5px] rounded-[10px] border border-surface/25 bg-linear-135 from-ink to-primary lg:hidden"
        >
          <span className={`h-0.5 w-5 rounded bg-surface transition-transform duration-[350ms] ease-nav ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 rounded bg-surface transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 rounded bg-surface transition-transform duration-[350ms] ease-nav ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu: panel unfolds, items slide in with stagger, same sliding pill */}
      <nav
        id="mobile-nav"
        aria-label="Main mobile"
        className={`fixed inset-x-0 top-[76px] border-b border-surface/10 bg-ink/95 pb-7 pt-5 backdrop-blur-[14px] transition-[clip-path,visibility] duration-500 ease-nav lg:hidden ${
          open ? "visible [clip-path:inset(0)]" : "invisible [clip-path:inset(0_0_100%_0)]"
        }`}
      >
        <div className="shell flex flex-col gap-[18px]">
          <ul ref={mobileListRef} className="relative flex flex-col" onMouseLeave={() => setMobileHover(null)}>
            <span data-pill aria-hidden className={pillClass} />
            {mainNav.map((link, i) => (
              <li
                key={link.href}
                style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}
                className={`transition-[opacity,translate] duration-[400ms] ease-soft ${open ? "translate-x-0 opacity-100" : "-translate-x-[18px] opacity-0"}`}
              >
                <Link
                  data-pill-item
                  href={link.href}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setMobileHover(i)}
                  className={`${linkClass} py-[13px] text-base ${i === mobileTarget ? "text-surface" : "text-surface/80"}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div
            style={{ transitionDelay: open ? "300ms" : "0ms" }}
            className={`flex flex-col gap-3 transition-[opacity,translate] duration-[400ms] ease-soft ${open ? "translate-x-0 opacity-100" : "-translate-x-[18px] opacity-0"}`}
          >
            <ButtonLink href="/login" variant="dark" className="w-full" onClick={() => setOpen(false)}>Login</ButtonLink>
            <ButtonLink href="/contact#register" className="w-full" onClick={() => setOpen(false)}>Register School</ButtonLink>
          </div>
        </div>
      </nav>
    </header>
  );
}
