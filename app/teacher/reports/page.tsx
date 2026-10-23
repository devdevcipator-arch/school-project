import type { Metadata } from "next";
import ReportsHub from "@/components/teacher/reports/ReportsHub";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Result Card | Teacher Portal | ${site.name}`,
};

// Student Academic Reports & Dispatches: compile, review and send term report cards
export default function ReportsPage() {
  return <ReportsHub />;
}
