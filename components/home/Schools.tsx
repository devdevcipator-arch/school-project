import { CheckIcon } from "@/components/ui/Eyebrow";
import { Icon, iconPaths } from "@/components/ui/Icon";
import { SectionHead } from "@/components/ui/SectionHead";
import TrustedMarquee from "@/components/home/TrustedMarquee";

const stats = [
  { value: "100%", label: "Paperless attendance" },
  { value: "3", label: "Connected roles" },
  { value: "Seconds", label: "To generate a quiz with AI" },
  { value: "24/7", label: "Student portal access" },
];

const roles: { tag: string; title: string; icon: string; featured?: boolean; items: string[] }[] = [
  {
    tag: "Principal / Administrator",
    title: "Lead with real-time visibility",
    icon: iconPaths.chart,
    items: [
      "Real-time teacher monitoring with daily check-in & check-out timestamps",
      "Staff attendance overview at a glance",
      "School-level analytics on attendance and academic progress",
      "Role-specific announcements to teachers, students or school-wide",
    ],
  },
  {
    tag: "Teachers",
    title: "Teach more, file less",
    icon: iconPaths.star,
    featured: true,
    items: [
      "Self-attendance marking with one tap",
      "Quick student class attendance",
      "Upload homework and send progress reports directly",
      "Digital report card dispatch to students",
      "AI test & quiz generator, ready in seconds",
    ],
  },
  {
    tag: "Students",
    title: "Everything in one dashboard",
    icon: iconPaths.cap,
    items: [
      "Personalized dashboard",
      "Take online AI-generated tests & quizzes",
      "Track personal attendance records",
      "Notice feed for school announcements",
      "Download digital report cards",
    ],
  },
];

const benefits = [
  { icon: iconPaths.doc, title: "Go fully paperless", text: "Registers, notices, homework and report cards, all digital." },
  { icon: iconPaths.star, title: "AI that saves hours", text: "Teachers create tests and quizzes instantly instead of writing them by hand." },
  { icon: iconPaths.chart, title: "Decisions with data", text: "Principals see attendance and progress analytics in real time." },
  { icon: iconPaths.megaphone, title: "Targeted communication", text: "Send the right announcement to the right role, every time." },
];


export default function Schools() {
  return (
    <section id="schools" className="bg-surface py-20 lg:py-[104px]">
      <div className="shell">
        <SectionHead eyebrow="For Schools" title="Built for schools, designed around the three people who run them.">
          From one campus to many, schools move their daily operations online and stop chasing paper registers, printed
          notices and handwritten report cards.
        </SectionHead>

        <ul className="grid grid-cols-2 gap-3 sm:gap-[18px] lg:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label} data-reveal className="rounded-[14px] border border-ink/10 bg-white px-3 py-5 text-center shadow-[0_10px_30px_rgba(6,30,41,.08)] sm:px-5 sm:py-[26px]">
              <strong className="block bg-linear-135 from-primary to-accent bg-clip-text text-[clamp(1.6rem,2.8vw,2.2rem)] font-extrabold text-transparent">
                {s.value}
              </strong>
              <span className="text-[.9rem] text-ink/60">{s.label}</span>
            </li>
          ))}
        </ul>

        <TrustedMarquee />

        <SectionHead eyebrow="Role-based access" title="One platform. Three dedicated portals." className="mt-[72px] lg:mt-24">
          Every role sees exactly what it needs, nothing more and nothing less.
        </SectionHead>

        <div className="mx-auto grid max-w-[620px] gap-6 lg:max-w-none lg:grid-cols-3">
          {roles.map((r) => (
            <article
              key={r.tag}
              data-reveal
              className={`flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_10px_30px_rgba(6,30,41,.08)] transition-[translate,box-shadow] duration-[350ms] ease-soft hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(6,30,41,.16)] ${
                r.featured ? "border-2 border-accent" : "border border-ink/10"
              }`}
            >
              <div className={`flex items-center justify-between gap-3 bg-linear-135 px-6 py-[22px] ${r.featured ? "from-primary to-accent" : "from-ink to-primary"}`}>
                <span className="grid size-12 place-items-center rounded-[14px] border border-surface/25 bg-surface/15 text-surface">
                  <Icon d={r.icon} className="size-6" />
                </span>
                <span className="rounded-full bg-surface px-3 py-1.5 text-[.82rem] font-bold text-primary">{r.tag}</span>
              </div>
              <div className="flex-1 p-6">
                <h3 className="mb-3.5 text-[1.2rem] font-bold text-primary">{r.title}</h3>
                <ul className="grid gap-2.5">
                  {r.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[.93rem] text-ink/80">
                      <span className="mt-[3px]"><CheckIcon /></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-7 rounded-[22px] bg-linear-135 from-ink to-primary p-[clamp(28px,4vw,48px)] text-surface sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} data-reveal>
              <span className="mb-4 grid size-[52px] place-items-center rounded-[14px] bg-accent text-ink">
                <Icon d={b.icon} className="size-7" />
              </span>
              <h3 className="mb-2 text-[1.1rem] font-bold">{b.title}</h3>
              <p className="text-[.93rem] text-surface/80">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
