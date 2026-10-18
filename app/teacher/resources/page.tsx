import type { Metadata } from "next";
import ResourceHub from "@/components/resources/ResourceHub";
import { teacher } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Resources | Teacher Portal | ${site.name}`,
};

// Resource Hub & Helping Books: universal library with teacher-only upload and management tools
export default function ResourcesPage() {
  return <ResourceHub role="teacher" user={teacher.name} allowStudentPreview />;
}
