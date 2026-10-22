import type { Metadata } from "next";
import CopilotWorkspace from "@/components/copilot/CopilotWorkspace";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Student AI | Student Portal | ${site.name}`,
};

// Student AI Study Copilot: same workspace as the principal's, limited to course and study questions (no personal data).
export default function AiPage() {
  return <CopilotWorkspace persona="student" />;
}
