import type { Metadata } from "next";
import AssessmentsBoard from "@/components/student/assessments/AssessmentsBoard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Assessments | Student Portal | ${site.name}`,
};

// Assessments: view-only reminders of quizzes, tests and homework, with due dates and teacher extensions
export default function AssessmentsPage() {
  return <AssessmentsBoard />;
}
