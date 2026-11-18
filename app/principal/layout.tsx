import type { Metadata } from "next";
import AuthGuard from "@/components/auth/AuthGuard";
import LogoutButton from "@/components/auth/LogoutButton";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { EmergencyBanner } from "@/components/announcements/emergency";
import NotificationBell from "@/components/principal/NotificationBell";
import ProfileCard from "@/components/principal/ProfileCard";
import { principalNav, principalTitles } from "@/lib/principal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Principal Portal | ${site.name}`,
  description: `${site.name} principal portal: attendance, fees, announcements and AI copilot.`,
};

export default function PrincipalLayout({ children }: LayoutProps<"/principal">) {
  return (
    <AuthGuard>
      <DashboardShell
        nav={principalNav}
        banner={<EmergencyBanner />}
        titles={principalTitles}
        profile={
          <div className="flex shrink-0 items-center gap-3">
            <NotificationBell />
            <ProfileCard />
          </div>
        }
        footer={<LogoutButton />}
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
