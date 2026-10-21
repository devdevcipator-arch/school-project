import type { Metadata } from "next";
import PageScaffold from "@/components/student/PageScaffold";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `My Attendance | Student Portal | ${site.name}`,
};

// My Attendance: term dial, monthly P/A/L calendar log and absence breakdown (read-only)
export default function AttendancePage() {
  return <PageScaffold path="/student/attendance" />;
}
