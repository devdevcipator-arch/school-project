import type { Metadata } from "next";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `School Setup | ${site.name}`,
  description: `Set up your school on ${site.name}: calendar, timings, classes, subjects, fee rules and policies.`,
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
