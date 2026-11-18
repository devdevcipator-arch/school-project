import type { Metadata } from "next";
import AuthGuard from "@/components/auth/AuthGuard";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `School Setup | ${site.name}`,
  description: `Set up your school on ${site.name}: calendar, timings, classes, subjects, fee rules and policies.`,
};

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingWizard />
    </AuthGuard>
  );
}
