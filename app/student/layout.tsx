import type { Metadata } from "next";
import Link from "next/link";
import { EmergencyBanner } from "@/components/announcements/emergency";
import DashboardShell from "@/components/dashboard/DashboardShell";
import NotificationBell from "@/components/principal/NotificationBell";
import StudentProfileCard from "@/components/student/StudentProfileCard";
import { studentNav, studentNotifications, studentTitles } from "@/lib/student";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Student Portal | ${site.name}`,
  description: `${site.name} student portal: attendance, assessments, reports, resources, notices and AI study copilot.`,
};

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return (
    <DashboardShell
      nav={studentNav}
      portalLabel="Student portal"
      banner={<EmergencyBanner />}
      titles={studentTitles}
      profile={
        <div className="flex shrink-0 items-center gap-3">
          <NotificationBell notifications={studentNotifications} />
          <StudentProfileCard />
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
