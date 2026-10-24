import type { Metadata } from "next";
import ClassFees from "@/components/teacher/class-fees/ClassFees";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Class Fees | Teacher Portal | ${site.name}`,
};

// Class Fees: monthly Paid / Unpaid fee register per class (no amounts) + fee history and export
export default function ClassFeesPage() {
  return <ClassFees />;
}
