import type { Metadata } from "next";
import StudentOverview from "@/components/student/overview/StudentOverview";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Overview | Student Portal | ${site.name}`,
};

// Student Overview: urgent notices, attendance, pending work, latest result, daily schedule and deadlines
export default function StudentOverviewPage() {
  return <StudentOverview />;
}
