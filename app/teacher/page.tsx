import type { Metadata } from "next";
import TeacherOverview from "@/components/teacher/overview/TeacherOverview";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Overview | Teacher Portal | ${site.name}`,
};

// Teacher Overview: greeting + class selector, KPIs, attendance, progress and assessments
export default function TeacherOverviewPage() {
  return <TeacherOverview />;
}
