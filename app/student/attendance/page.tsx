import type { Metadata } from "next";
import AttendanceView from "@/components/student/attendance/AttendanceView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `My Attendance | Student Portal | ${site.name}`,
};

// My Attendance: term totals, weekly chart, monthly split, calendar of present/absent/leave days and days missed (read-only)
export default function AttendancePage() {
  return <AttendanceView />;
}
