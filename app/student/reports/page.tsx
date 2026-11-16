import type { Metadata } from "next";
import ReportsView from "@/components/student/reports/ReportsView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Reports | Student Portal | ${site.name}`,
};

// Reports: the progress reports teachers have written for this student, read-only
export default function ReportsPage() {
  return <ReportsView />;
}
