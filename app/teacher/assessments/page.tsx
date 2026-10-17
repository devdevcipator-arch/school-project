import type { Metadata } from "next";
import ComingSoon from "@/components/teacher/ComingSoon";
import { teacherNav } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Assessments | Teacher Portal | ${site.name}`,
};

// Placeholder until the Assessments page spec is shared.
export default function AssessmentsPage() {
  return <ComingSoon title="Assessments" icon={teacherNav[4].icon} />;
}
