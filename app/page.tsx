import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Schools from "@/components/home/Schools";
import Faq from "@/components/home/Faq";
import Cta from "@/components/shared/Cta";

// Home page: exactly 6 sections in order (Header, Hero, Schools, FAQ, CTA, Footer)
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Schools />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
