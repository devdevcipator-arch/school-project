import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { site } from "@/lib/site";

export default function Cta() {
  return (
    <section id="get-started" className="relative isolate overflow-hidden bg-ink py-[84px] text-center text-surface lg:py-[120px]">
      {/* Background image 2 of 2 */}
      <Image src="/images/cta.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(29,84,109,.88),rgba(6,30,41,.86))]" />

      <div className="shell">
        <div className="mx-auto max-w-[860px]">
        <Eyebrow light>For School Owners &amp; Principals</Eyebrow>
        <h2 data-reveal className="mb-[18px] text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold leading-[1.15] tracking-tight">
          Bring your school onto {site.name} today.
        </h2>
        <p data-reveal className="mb-9 text-[1.1rem] text-surface/80">
          Register your school in minutes, onboard your teachers and students quickly, and switch to fully paperless
          management: attendance, notices, AI quizzes and report cards in one place.
        </p>
        <div data-reveal className="flex flex-wrap justify-center gap-3.5">
          <ButtonLink href="/signup" size="xl" className="max-sm:w-full max-sm:whitespace-normal">
            Register Your School Now
          </ButtonLink>
          <ButtonLink href="/contact#demo" variant="dark" size="xl" className="max-sm:w-full">
            Book a Demo
          </ButtonLink>
        </div>
        </div>
      </div>
    </section>
  );
}
