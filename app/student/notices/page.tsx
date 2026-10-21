import type { Metadata } from "next";
import PageScaffold from "@/components/student/PageScaffold";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Notices | Student Portal | ${site.name}`,
};

// Notices: school-wide alerts from the Principal and class circulars from teachers
export default function NoticesPage() {
  return <PageScaffold path="/student/notices" />;
}
