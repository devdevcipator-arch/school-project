import type { Metadata } from "next";
import ComingSoon from "@/components/teacher/ComingSoon";
import { teacherNav } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `My Attendance | Teacher Portal | ${site.name}`,
};

// Placeholder until the My Attendance page spec is shared.
export default function MyAttendancePage() {
  return <ComingSoon title="My Attendance" icon={teacherNav[1].icon} />;
}
