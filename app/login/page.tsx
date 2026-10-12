import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Login | ${site.name}`,
  description: `Login to ${site.name} to manage your school.`,
};

export default function LoginPage() {
  return (
    <AuthShell
      image="/images/hero.jpg"
      eyebrow="Welcome back"
      title="Login to your school workspace"
      text="Sign in to your school account and continue where you left off."
      points={["Attendance and announcements in one place", "AI-generated tests and quizzes", "Reports and assignments, always paperless"]}
    >
      <LoginForm />
    </AuthShell>
  );
}
