import type { Metadata } from "next";
import LeaveRequestsBoard from "@/components/principal/LeaveRequestsBoard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Leave Requests | Principal Portal | ${site.name}`,
};

// Leave Requests: what teachers send from My Attendance, with approve and decline.
export default function LeavePage() {
  return <LeaveRequestsBoard />;
}
