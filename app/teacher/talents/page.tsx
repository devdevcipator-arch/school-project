import type { Metadata } from "next";
import ComingSoon from "@/components/teacher/ComingSoon";
import { teacherNav } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Talents | Teacher Portal | ${site.name}`,
};

// Placeholder until the Talents page spec is shared.
export default function TalentsPage() {
  return <ComingSoon title="Talents" icon={teacherNav[3].icon} />;
}
