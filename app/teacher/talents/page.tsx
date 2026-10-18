import type { Metadata } from "next";
import TalentsBoard from "@/components/talents/TalentsBoard";
import { mySections } from "@/lib/classAttendance";
import { teacher } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Talents | Teacher Portal | ${site.name}`,
};

const sections = mySections.map((s) => s.section);

// Same talent directory and flow as the principal portal, limited to the teacher's own classes.
export default function TalentsPage() {
  return <TalentsBoard sections={sections} endorser={{ name: teacher.name, role: teacher.role }} />;
}
