"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { Icon } from "@/components/ui/Icon";
import { pillClass, useSlidingPill } from "@/components/motion/useSlidingPill";

type NavItem = { href: string; label: string; icon: string };

/**
 * Dashboard shell: dark sidebar with the platform sliding pill (vertical),
 * off-canvas drawer on small screens. Shared by every role portal.
 */
export default function DashboardShell({ nav, footer, children }: { nav: NavItem[]; footer?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const activeIndex = Math.max(0, nav.findIndex((l) => l.href === pathname));
  const [open, setOpen] = useState(false);
  const { listRef, target, setHover } = useSlidingPill(activeIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh bg-surface">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-linear-135 from-ink to-primary px-4 lg:hidden">
        <Logo />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="dashboard-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-11 flex-col items-center justify-center gap-[5px] rounded-[10px] border border-surface/25"
        >
          <span className={`h-0.5 w-5 rounded bg-surface transition-transform duration-[350ms] ease-nav ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 rounded bg-surface transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 rounded bg-surface transition-transform duration-[350ms] ease-nav ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Backdrop for the mobile drawer */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <aside
        id="dashboard-nav"
        className={`fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col bg-linear-to-b from-ink to-[#0b2a38] text-surface transition-transform duration-500 ease-nav lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] shrink-0 items-center px-6">
          <Logo />
        </div>

        <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-2 px-3 text-[.7rem] font-bold uppercase tracking-[.14em] text-surface/45">Principal portal</p>
          <ul ref={listRef} className="relative flex flex-col gap-1" onMouseLeave={() => setHover(null)}>
            <span data-pill aria-hidden className={pillClass} />
            {nav.map((item, i) => (
              <li key={item.href}>
                <Link
                  data-pill-item
                  href={item.href}
                  aria-current={i === activeIndex ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className={`relative z-10 flex items-center gap-3 rounded-full px-4 py-[11px] text-[.92rem] font-semibold transition-colors duration-[350ms] ease-nav ${
                    i === target ? "text-surface" : "text-surface/70 hover:text-surface"
                  }`}
                >
                  <Icon d={item.icon} className="size-[19px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {footer && <div className="shrink-0 border-t border-surface/10 p-4">{footer}</div>}
      </aside>

      <div className="lg:pl-[268px]">{children}</div>
    </div>
  );
}
