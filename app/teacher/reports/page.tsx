import type { Metadata } from "next";
import ComingSoon from "@/components/teacher/ComingSoon";
import { teacherNav } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Reports | Teacher Portal | ${site.name}`,
};

// Placeholder until the Reports page spec is shared.
export default function ReportsPage() {
  return <ComingSoon title="Reports" icon={teacherNav[5].icon} />;
}
