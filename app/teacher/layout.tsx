import type { Metadata } from "next";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import LogoutButton from "@/components/auth/LogoutButton";
import DashboardShell from "@/components/dashboard/DashboardShell";
import NotificationBell from "@/components/principal/NotificationBell";
import { teacher, teacherNav, teacherNotifications, teacherTitles } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Teacher Portal | ${site.name}`,
  description: `${site.name} teacher portal: attendance, assessments, reports and AI assistant.`,
};

export default function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  return (
    <AuthGuard>
      <DashboardShell
        nav={teacherNav}
        portalLabel="Teacher portal"
        titles={teacherTitles}
        profile={
          <div className="flex shrink-0 items-center gap-3">
            <NotificationBell notifications={teacherNotifications} />
            <Link href="/teacher/account" aria-label="Open my profile" className="flex shrink-0 items-center gap-3 rounded-2xl border border-ink/8 bg-white p-2 shadow-[0_10px_30px_rgba(6,30,41,.05)] transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-135 from-primary to-accent text-[.85rem] font-bold text-surface">
                {teacher.initials}
              </span>
              <span className="grid min-w-0 pr-3 max-sm:hidden">
                <strong className="truncate text-[.9rem]">{teacher.name}</strong>
                <span className="truncate text-[.78rem] text-ink/55">{teacher.role}</span>
              </span>
            </Link>
          </div>
        }
        footer={<LogoutButton />}
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
