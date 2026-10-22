import type { Metadata } from "next";
import ResourceHub from "@/components/resources/ResourceHub";
import { student } from "@/lib/student";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Resources | Student Portal | ${site.name}`,
};

// Resources: the same library as the teacher Resource Hub, read-only (browse, preview and download; no upload or management)
export default function ResourcesPage() {
  return <ResourceHub role="student" user={student.name} />;
}
