import type { Metadata } from "next";
import StudentAccount from "@/components/student/StudentAccount";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `My Profile | Student Portal | ${site.name}`,
};

export default function StudentAccountPage() {
  return <StudentAccount />;
}
