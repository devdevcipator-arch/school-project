import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { CheckIcon, Eyebrow } from "@/components/ui/Eyebrow";
import EcosystemVisual from "@/components/about/EcosystemVisual";
import { site } from "@/lib/site";

const values = ["Completely paperless", "Efficient by design", "AI-enabled assessments"];

export default function AboutHero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink pb-[72px] pt-[116px] text-surface lg:pb-[110px] lg:pt-[148px]">
      {/* Background image 1 of 2 */}
      <Image src="/images/about-hero.jpg" alt="" fill preload sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(6,30,41,.94)_0%,rgba(6,30,41,.8)_45%,rgba(29,84,109,.62)_100%)]" />

      <div className="shell grid items-center gap-[clamp(36px,5vw,72px)] lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Eyebrow light>About {site.name}</Eyebrow>
          <h1 data-reveal className="mb-5 text-[clamp(2.1rem,4.4vw,3.6rem)] font-extrabold leading-[1.1] tracking-tight">
            Our mission: every school paperless, efficient and AI-enabled.
          </h1>
          <p data-reveal className="mb-8 max-w-[600px] text-[1.08rem] text-surface/80">
            Schools still lose hours to paper registers, printed notices and hand-written tests. We built {site.name} to
            change that, connecting Principals, Teachers and Students in a single, seamless digital ecosystem where
            attendance, announcements, assessments and report cards simply flow.
          </p>
          <div data-reveal className="mb-8 flex flex-wrap gap-3.5">
            <ButtonLink href="/contact#register" size="lg" className="max-sm:w-full">
              Register School
            </ButtonLink>
            <ButtonLink href="/contact" variant="dark" size="lg" className="max-sm:w-full">
              Contact Us
            </ButtonLink>
          </div>
          <ul data-reveal className="flex flex-wrap gap-x-[22px] gap-y-2.5 text-[.92rem] text-surface/80">
            {values.map((v) => (
              <li key={v} className="flex items-center gap-2">
                <CheckIcon dark />
                {v}
              </li>
            ))}
          </ul>
        </div>

        <EcosystemVisual />
      </div>
    </section>
  );
}
