import type { Metadata } from "next";
import StudentOverview from "@/components/student/overview/StudentOverview";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Overview | Student Portal | ${site.name}`,
};

// Student Overview: greeting, attendance, pending work and latest result
export default function StudentOverviewPage() {
  return <StudentOverview />;
}
