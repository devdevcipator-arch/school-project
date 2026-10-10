import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactSection from "@/components/contact/ContactSection";
import Cta from "@/components/shared/Cta";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact Us | ${site.name}`,
  description: `Contact the ${site.name} team for inquiries, school registration or a live demo.`,
};

// Contact page: exactly 4 sections in order (Header, Contact Us Form, CTA, Footer)
export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <ContactSection />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
