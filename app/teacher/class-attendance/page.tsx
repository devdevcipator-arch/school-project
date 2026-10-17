import type { Metadata } from "next";
import ComingSoon from "@/components/teacher/ComingSoon";
import { teacherNav } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Class Attendance | Teacher Portal | ${site.name}`,
};

// Placeholder until the Class Attendance page spec is shared.
export default function ClassAttendancePage() {
  return <ComingSoon title="Class Attendance" icon={teacherNav[2].icon} />;
}
