import type { Metadata } from "next";
import AssessmentsHub from "@/components/teacher/assessments/AssessmentsHub";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Assessments | Teacher Portal | ${site.name}`,
};

// Assessments: the same board students see, with create and edit for the teacher
export default function AssessmentsPage() {
  return <AssessmentsHub />;
}
