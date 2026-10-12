import Link from "next/link";
import type { ReactNode } from "react";

export type Tone = "ok" | "warn" | "serious" | "danger" | "neutral";

const toneClass: Record<Tone, string> = {
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/12 text-[#9a6a0f]",
  serious: "bg-serious/12 text-[#a84f12]",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-primary/10 text-primary",
};

export const toneFill: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  serious: "bg-serious",
  danger: "bg-danger",
  neutral: "bg-primary",
};

/** Readable text shades of the status colors (darkened amber/orange for contrast on white). */
export const toneText: Record<Tone, string> = {
  ok: "text-ok",
  warn: "text-[#9a6a0f]",
  serious: "text-[#a84f12]",
  danger: "text-danger",
  neutral: "text-primary",
};

const toneIcon: Record<Tone, string> = {
  ok: "M5 12l4 4 10-10",
  warn: "M12 7v6 M12 17h.01",
  serious: "M12 7v6 M12 17h.01",
  danger: "M7 7l10 10 M17 7 7 17",
  neutral: "M12 8h.01 M12 11v6",
};

/** Status badge: always icon + label, never color alone. */
export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[.74rem] font-bold ${toneClass[tone]} ${className}`}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d={toneIcon[tone]} />
      </svg>
      {children}
    </span>
  );
}

/** Trend vs last period. Positive is good unless `invert` is set. */
export function Trend({ value, label = "vs last month", invert = false }: { value: number; label?: string; invert?: boolean }) {
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <span className="inline-flex items-center gap-1.5 text-[.78rem] text-ink/55">
      <span className={`inline-flex items-center gap-0.5 font-bold ${good ? "text-ok" : "text-danger"}`}>
        <svg viewBox="0 0 20 20" aria-hidden className={`size-3.5 ${up ? "" : "rotate-180"}`}>
          <path d="M10 15V5M5 10l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {Math.abs(value)}%
      </span>
      {label}
    </span>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-reveal
      className={`flex min-w-0 flex-col rounded-[20px] border border-ink/8 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(6,30,41,.09)] sm:p-6 ${className}`}
    >
      {(title || action) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[1.05rem] font-extrabold tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[.84rem] text-ink/55">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Text link with arrow, used as the one-click CTA at the bottom of widgets. */
export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-[.88rem] font-bold text-primary transition-colors hover:text-accent"
    >
      {children}
      <svg viewBox="0 0 20 20" aria-hidden className="size-4 transition-transform duration-300 ease-soft group-hover:translate-x-1">
        <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

/** Thin horizontal progress bar, rounded data-end, square at the baseline. */
export function Bar({ value, max = 100, fill = "bg-primary", label }: { value: number; max?: number; fill?: string; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2.5 w-full overflow-hidden rounded-r-full bg-ink/6">
      <div className={`h-full rounded-r-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
