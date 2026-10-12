import type { Metadata } from "next";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { principal, principalNav } from "@/lib/principal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Principal Portal | ${site.name}`,
  description: `${site.name} principal portal: attendance, fees, announcements and AI copilot.`,
};

export default function PrincipalLayout({ children }: LayoutProps<"/principal">) {
  return (
    <DashboardShell
      nav={principalNav}
      footer={
        <div className="flex items-center gap-3 rounded-2xl bg-surface/8 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-135 from-primary to-accent text-[.85rem] font-bold">
            {principal.initials}
          </span>
          <span className="grid min-w-0 flex-1">
            <strong className="truncate text-[.9rem]">{principal.name}</strong>
            <span className="truncate text-[.78rem] text-surface/60">Principal</span>
          </span>
          <Link href="/login" aria-label="Log out" title="Log out" className="grid size-9 place-items-center rounded-lg text-surface/60 transition-colors hover:bg-surface/10 hover:text-surface">
            <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10" />
            </svg>
          </Link>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
