import type { Metadata } from "next";
import FeesBoard from "@/components/fees/FeesBoard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Student Fees | Principal Portal | ${site.name}`,
};

// Student Fee Management & Defaulter Tracking: collection KPIs, fee directory, ledgers and reminders.
export default function FeesPage() {
  return <FeesBoard />;
}
