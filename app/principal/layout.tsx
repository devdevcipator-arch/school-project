import type { Metadata } from "next";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { EmergencyBanner } from "@/components/announcements/emergency";
import { principal, principalNav, principalTitles } from "@/lib/principal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Principal Portal | ${site.name}`,
  description: `${site.name} principal portal: attendance, fees, announcements and AI copilot.`,
};

export default function PrincipalLayout({ children }: LayoutProps<"/principal">) {
  return (
    <DashboardShell
      nav={principalNav}
      banner={<EmergencyBanner />}
      titles={principalTitles}
      profile={
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-ink/8 bg-white p-2 shadow-[0_10px_30px_rgba(6,30,41,.05)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-135 from-primary to-accent text-[.85rem] font-bold text-surface">
            {principal.initials}
          </span>
          <span className="grid min-w-0 pr-3 max-sm:hidden">
            <strong className="truncate text-[.9rem]">{principal.name}</strong>
            <span className="truncate text-[.78rem] text-ink/55">Principal</span>
          </span>
        </div>
      }
      footer={
        <Link href="/login" className="flex items-center gap-3 rounded-full px-4 py-[11px] text-[.92rem] font-semibold text-surface/70 transition-colors hover:bg-surface/10 hover:text-surface">
          <svg viewBox="0 0 24 24" aria-hidden className="size-[19px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10" />
          </svg>
          Log out
        </Link>
      }
    >
      {children}
    </DashboardShell>
  );
}
