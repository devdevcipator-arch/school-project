import type { Metadata } from "next";
import LeaveBoard from "@/components/teacher/leave/LeaveBoard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Leave | Teacher Portal | ${site.name}`,
};

// Leave: apply for leave and follow each request; the principal answers on /principal/leave.
export default function LeavePage() {
  return <LeaveBoard />;
}
