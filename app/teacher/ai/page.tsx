import type { Metadata } from "next";
import ComingSoon from "@/components/teacher/ComingSoon";
import { teacherNav } from "@/lib/teacher";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `AI Assistant | Teacher Portal | ${site.name}`,
};

// Placeholder until the AI Assistant page spec is shared.
export default function AiPage() {
  return <ComingSoon title="AI Assistant" icon={teacherNav[7].icon} />;
}
