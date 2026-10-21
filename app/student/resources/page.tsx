import type { Metadata } from "next";
import PageScaffold from "@/components/student/PageScaffold";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Resources | Student Portal | ${site.name}`,
};

// Resources: read-only subject folders, textbooks, helping materials and lecture slides
export default function ResourcesPage() {
  return <PageScaffold path="/student/resources" />;
}
