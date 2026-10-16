import type { Metadata } from "next";
import ExecHeader from "@/components/principal/ExecHeader";
import KpiCards from "@/components/principal/KpiCards";
import AttendanceSection from "@/components/principal/AttendanceSection";
import FeesAndNotices from "@/components/principal/FeesAndNotices";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Overview | Principal Portal | ${site.name}`,
};

// Principal Overview: header, KPIs, attendance, fees + announcements
export default function PrincipalOverview() {
  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <ExecHeader />
      <KpiCards />
      <AttendanceSection />
      <FeesAndNotices />
    </main>
  );
}
