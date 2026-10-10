import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AboutHero from "@/components/about/AboutHero";
import OurWork from "@/components/about/OurWork";
import Cta from "@/components/shared/Cta";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `About Us | ${site.name}`,
  description: `Why we built ${site.name}: one paperless, AI-enabled system connecting Principals, Teachers and Students.`,
};

// About page: exactly 5 sections in order (Header, Hero, Our Work, CTA, Footer)
export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <AboutHero />
        <OurWork />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
