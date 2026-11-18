import type { Metadata } from "next";
import { EmergencyBanner } from "@/components/announcements/emergency";
import AuthGuard from "@/components/auth/AuthGuard";
import LogoutButton from "@/components/auth/LogoutButton";
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
    <AuthGuard>
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
        footer={<LogoutButton />}
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
