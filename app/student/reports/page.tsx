import type { Metadata } from "next";
import PageScaffold from "@/components/student/PageScaffold";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Reports | Student Portal | ${site.name}`,
};

// Reports: term report vault, grades ledger, teacher remarks and PDF download
export default function ReportsPage() {
  return <PageScaffold path="/student/reports" />;
}
