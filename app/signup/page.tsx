import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Sign Up | ${site.name}`,
  description: `Register your school on ${site.name}.`,
};

export default function SignupPage() {
  return (
    <AuthShell
      image="/images/about-hero.jpg"
      eyebrow="Get started"
      title="Create your account in a minute"
      text="Join your school on one paperless platform built for Principals, Teachers and Students."
      points={["Simple setup, no paperwork", "Dashboards for your whole school", "Secure and private by default"]}
    >
      <SignupForm />
    </AuthShell>
  );
}
