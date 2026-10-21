import type { Metadata } from "next";
import PageScaffold from "@/components/student/PageScaffold";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Overview | Student Portal | ${site.name}`,
};

// Student Overview: urgent notices, attendance ring, pending quizzes and daily schedule
export default function StudentOverviewPage() {
  return <PageScaffold path="/student" />;
}
