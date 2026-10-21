import type { Metadata } from "next";
import PageScaffold from "@/components/student/PageScaffold";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Student AI | Student Portal | ${site.name}`,
};

// Student AI: concept tutoring, question explanations and curriculum-aligned study help
export default function AiPage() {
  return <PageScaffold path="/student/ai" />;
}
