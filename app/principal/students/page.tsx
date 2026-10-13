import type { Metadata } from "next";
import StudentsBoard from "@/components/students/StudentsBoard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Students | Principal Portal | ${site.name}`,
};

// Student Management & Class Directory: class rosters, profiles and attendance monitoring.
export default function StudentsPage() {
  return <StudentsBoard />;
}
