import type { Metadata } from "next";
import MyAttendance from "@/components/teacher/my-attendance/MyAttendance";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `My Attendance | Teacher Portal | ${site.name}`,
};

// My Attendance: today's check-in/out, monthly KPIs, day-by-day log, trends and full history
export default function MyAttendancePage() {
  return <MyAttendance />;
}
