import type { Metadata } from "next";
import ComingSoon from "@/components/teacher/ComingSoon";
import { teacherNav } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Resources | Teacher Portal | ${site.name}`,
};

// Placeholder until the Resources page spec is shared.
export default function ResourcesPage() {
  return <ComingSoon title="Resources" icon={teacherNav[6].icon} />;
}
