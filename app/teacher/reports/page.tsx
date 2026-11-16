import type { Metadata } from "next";
import ReportsHub from "@/components/teacher/reports/ReportsHub";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Reports | Teacher Portal | ${site.name}`,
};

// Reports: write a progress report for a student (time frame + description) and list every report written
export default function ReportsPage() {
  return <ReportsHub />;
}
