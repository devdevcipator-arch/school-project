import type { Metadata } from "next";
import TalentsBoard from "@/components/talents/TalentsBoard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Talents | Principal Portal | ${site.name}`,
};

// Talent & Co-Curricular Directory: scout, filter and shortlist talented students.
export default function TalentsPage() {
  return <TalentsBoard />;
}
