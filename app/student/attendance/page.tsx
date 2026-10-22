import type { Metadata } from "next";
import AttendanceView from "@/components/student/attendance/AttendanceView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `My Attendance | Student Portal | ${site.name}`,
};

// My Attendance: term totals and a searchable day-by-day log of present, absent and leave days (read-only)
export default function AttendancePage() {
  return <AttendanceView />;
}
