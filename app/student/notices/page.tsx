import type { Metadata } from "next";
import NoticesFeed from "@/components/student/notices/NoticesFeed";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Notices | Student Portal | ${site.name}`,
};

// Notices: the Principal's published announcements addressed to this student (school-wide, students and their grade)
export default function NoticesPage() {
  return <NoticesFeed />;
}
