import type { Metadata } from "next";
import CopilotWorkspace from "@/components/copilot/CopilotWorkspace";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `AI Assistant | Teacher Portal | ${site.name}`,
};

// Teacher AI Copilot: same workspace as the principal's, scoped to the teacher's own classes.
export default function AiPage() {
  return <CopilotWorkspace persona="teacher" />;
}
