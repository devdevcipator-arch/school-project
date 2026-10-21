import type { Metadata } from "next";
import PageScaffold from "@/components/student/PageScaffold";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Assessments | Student Portal | ${site.name}`,
};

// Assessments: timed AI quiz runner, homework submission portal and score breakdown
export default function AssessmentsPage() {
  return <PageScaffold path="/student/assessments" />;
}
