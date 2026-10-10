import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { CheckIcon, Eyebrow } from "@/components/ui/Eyebrow";
import DashboardPreview from "@/components/home/DashboardPreview";
import { site } from "@/lib/site";

const points = ["Teacher check-in & check-out tracking", "AI test & quiz generator", "Digital report cards"];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink pb-[72px] pt-[116px] text-surface lg:pb-[110px] lg:pt-[148px]">
      {/* Background image 1 of 2 */}
      <Image src="/images/hero.jpg" alt="" fill preload sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(6,30,41,.94)_0%,rgba(6,30,41,.8)_45%,rgba(29,84,109,.62)_100%)]" />

      <div className="shell grid items-center gap-[clamp(36px,5vw,72px)] lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Eyebrow light>Paperless · Online · AI-Powered</Eyebrow>
          <h1 data-reveal className="mb-5 text-[clamp(2.1rem,4.4vw,3.6rem)] font-extrabold leading-[1.1] tracking-tight">
            Run your entire school online. Paperless, connected and powered by AI.
          </h1>
          <p data-reveal className="mb-8 max-w-[600px] text-[1.08rem] text-surface/80">
            {site.name} brings Principals, Teachers and Students into one unified system. Principals monitor attendance
            and analytics, teachers mark attendance and create AI-generated quizzes in seconds, and students take tests,
            track attendance and download report cards, all from a single dashboard.
          </p>
          <div data-reveal className="mb-8 flex flex-wrap gap-3.5">
            <ButtonLink href="/contact#register" size="lg" className="max-sm:w-full max-sm:whitespace-normal">
              Get Started: Register School
            </ButtonLink>
            <ButtonLink href="/contact" variant="dark" size="lg" className="max-sm:w-full">
              Contact Us
            </ButtonLink>
          </div>
          <ul data-reveal className="flex flex-wrap gap-x-[22px] gap-y-2.5 text-[.92rem] text-surface/80">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <CheckIcon dark />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
