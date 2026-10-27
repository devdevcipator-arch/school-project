import type { Metadata } from "next";
import ReportsHub from "@/components/teacher/reports/ReportsHub";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Result Card | Teacher Portal | ${site.name}`,
};

// Result Card (input): enter marks and remarks on the same card the student Result Card page shows, then send it
export default function ReportsPage() {
  return <ReportsHub />;
}
