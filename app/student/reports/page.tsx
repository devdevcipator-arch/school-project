import type { Metadata } from "next";
import ReportsView from "@/components/student/reports/ReportsView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Result Card | Student Portal | ${site.name}`,
};

// Reports: the term report cards the class teacher has dispatched, identical to the teacher's card, with PDF download
export default function ReportsPage() {
  return <ReportsView />;
}
