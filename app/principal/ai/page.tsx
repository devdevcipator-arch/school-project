import type { Metadata } from "next";
import CopilotWorkspace from "@/components/copilot/CopilotWorkspace";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `AI Assistant | Principal Portal | ${site.name}`,
};

// Executive AI Copilot & Knowledge Hub: live school queries, confirmed admin actions and the document vault.
export default function AiPage() {
  return <CopilotWorkspace />;
}
