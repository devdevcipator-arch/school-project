import type { Metadata } from "next";
import AssessmentsHub from "@/components/teacher/assessments/AssessmentsHub";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Assessments | Teacher Portal | ${site.name}`,
};

// Assessments & Tasks Hub: AI test generator, manual assignments, submission tracking and grading
export default function AssessmentsPage() {
  return <AssessmentsHub />;
}
