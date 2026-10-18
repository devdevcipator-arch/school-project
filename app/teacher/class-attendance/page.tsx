import type { Metadata } from "next";
import ClassAttendance from "@/components/teacher/class-attendance/ClassAttendance";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Class Attendance | Teacher Portal | ${site.name}`,
};

// Class Attendance: exception-based roll call (everyone Present by default) + attendance history and export
export default function ClassAttendancePage() {
  return <ClassAttendance />;
}
