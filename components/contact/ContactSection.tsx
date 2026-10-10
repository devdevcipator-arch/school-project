import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Icon, iconPaths } from "@/components/ui/Icon";
import ContactForm from "@/components/contact/ContactForm";
import { site } from "@/lib/site";

const mailPath = "M3 6h18v12H3z M3 7l9 6 9-6";
const phonePath = "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2";
const pinPath = "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z";

const details = [
  { label: "Support email", value: site.email, href: `mailto:${site.email}`, icon: mailPath },
  { label: "Phone", value: site.phone, href: site.phoneHref, icon: phonePath },
  { label: "Office address", value: site.address, icon: pinPath },
];

const topics = ["School registration & onboarding", "AI test & quiz features", "System setup for your roles", "Live product demo"];

const lift =
  "transition-[translate,box-shadow,border-color,background-color] duration-[350ms] ease-soft hover:-translate-y-1 hover:border-accent hover:bg-surface/15 hover:shadow-[0_16px_34px_rgba(6,30,41,.3)]";

export default function ContactSection() {
  return (
    <section id="contact" className="relative bg-surface pb-20 lg:pb-[104px]">
      {/* Anchors for /contact#register and /contact#demo */}
      <span id="register" className="absolute top-0" aria-hidden />
      <span id="demo" className="absolute top-0" aria-hidden />

      <div className="shell pt-[116px] lg:pt-[124px]">
        <div className="relative grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          {/* Intro + institutional contact details, background image 1 of 2 */}
          <aside data-reveal className="relative isolate flex flex-col overflow-hidden rounded-[22px] bg-ink p-7 text-surface shadow-[0_30px_70px_rgba(6,30,41,.3)] sm:p-8 lg:p-10">
            <Image src="/images/contact-hero.jpg" alt="" fill preload sizes="(min-width: 1024px) 45vw, 100vw" className="-z-20 object-cover" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,rgba(6,30,41,.94)_0%,rgba(6,30,41,.86)_55%,rgba(29,84,109,.8)_100%)]" />

            <div>
              <Eyebrow light>Contact Us</Eyebrow>
            </div>
            <h1 className="mb-4 text-[clamp(1.9rem,3.4vw,2.8rem)] font-extrabold leading-[1.1] tracking-tight">
              Get in touch with our team
            </h1>
            <p className="mb-8 text-[1rem] text-surface/80">
              Principals, administrators and trustees: ask a question, register your school, or book a live demo.
            </p>

            <ul className="grid gap-3.5">
              {details.map((d) => {
                const inner = (
                  <>
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-135 from-primary to-accent text-surface">
                      <Icon d={d.icon} className="size-5" />
                    </span>
                    <span className="grid min-w-0">
                      <span className="text-[.72rem] font-bold uppercase tracking-[.12em] text-surface/65">{d.label}</span>
                      <span className="break-words font-semibold">{d.value}</span>
                    </span>
                  </>
                );
                const cls = `flex items-center gap-3.5 rounded-2xl border border-surface/15 bg-surface/10 p-3.5 ${lift}`;
                return (
                  <li key={d.label}>
                    {d.href ? <a href={d.href} className={cls}>{inner}</a> : <div className={cls}>{inner}</div>}
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 border-t border-surface/15 pt-6">
              <p className="mb-3 text-[.72rem] font-bold uppercase tracking-[.12em] text-accent">We can help with</p>
              <ul className="grid gap-2.5 text-[.92rem] text-surface/85">
                {topics.map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-accent text-ink">
                      <Icon d={iconPaths.check} className="size-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-8">
              <div className="flex items-center gap-3 rounded-2xl bg-surface/10 p-4 text-[.88rem]">
                <Icon d={iconPaths.clock} className="size-5 shrink-0 text-accent" />
                <span>
                  <strong className="block">Office hours</strong>
                  <span className="text-surface/75">Monday to Saturday, 9:00 AM to 5:00 PM</span>
                </span>
              </div>
            </div>
          </aside>

          {/* Form card */}
          <div data-reveal className="min-w-0 rounded-[22px] border border-ink/10 bg-white shadow-[0_30px_70px_rgba(6,30,41,.18)]">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
