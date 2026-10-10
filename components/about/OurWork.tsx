import { Icon, iconPaths } from "@/components/ui/Icon";
import { SectionHead } from "@/components/ui/SectionHead";
import { site } from "@/lib/site";

const steps = [
  { title: "Register your school", text: "Create your school's own workspace in minutes." },
  { title: "Onboard your people", text: "Add teachers and students quickly, each with their own portal." },
  { title: "Run every day paperless", text: "Attendance, notices, tests and report cards, all online." },
];

type Feature = { icon: string; title: string; text: string };
type Role = { tag: string; title: string; intro: string; before: string; icon: string; features: Feature[] };

const roles: Role[] = [
  {
    tag: "Principal / Administrator",
    title: "Full visibility, without the paperwork",
    intro: "Principals see what is happening across the school in real time and reach exactly the right people.",
    before: "Paper staff registers and notice boards",
    icon: iconPaths.chart,
    features: [
      { icon: iconPaths.clock, title: "Teacher check-in tracking", text: "Real-time teacher attendance with daily check-in and check-out timestamps." },
      { icon: iconPaths.chart, title: "School-wide analytics", text: "Attendance and academic progress trends for the whole school at a glance." },
      { icon: iconPaths.megaphone, title: "Role-specific announcements", text: "Send notices to teachers only, students only, or the entire school." },
    ],
  },
  {
    tag: "Teachers",
    title: "Less admin, more teaching",
    intro: "Teachers handle attendance, assessments and reporting digitally, with AI doing the heavy lifting.",
    before: "Roll calls, hand-written tests and printed report cards",
    icon: iconPaths.star,
    features: [
      { icon: iconPaths.check, title: "Digital self-attendance", text: "Mark your own attendance with one tap when you arrive and leave." },
      { icon: iconPaths.users, title: "Classroom attendance", text: "Take student attendance for each class in seconds." },
      { icon: iconPaths.spark, title: "AI test & quiz creation", text: "Generate complete tests and quizzes instantly from a topic and grade." },
      { icon: iconPaths.doc, title: "Digital report cards", text: "Deliver report cards and progress reports directly to each student." },
    ],
  },
  {
    tag: "Students",
    title: "Everything a student needs, in one place",
    intro: "Students get a personal dashboard for their tests, attendance, notices and results.",
    before: "Paper tests, lost notices and waiting for printed results",
    icon: iconPaths.cap,
    features: [
      { icon: iconPaths.quiz, title: "Online AI-generated quizzes", text: "Attempt assigned tests and quizzes online and see results once released." },
      { icon: iconPaths.clock, title: "Attendance records", text: "Check personal attendance history any time." },
      { icon: iconPaths.bell, title: "Official notices", text: "Receive school announcements meant for students in one feed." },
      { icon: iconPaths.download, title: "Report card downloads", text: "View and download digital report cards whenever they are published." },
    ],
  },
];

const cardHover =
  "transition-[translate,box-shadow,border-color] duration-[350ms] ease-soft hover:-translate-y-1 hover:border-accent hover:shadow-[0_24px_50px_rgba(6,30,41,.16)]";

export default function OurWork() {
  return (
    <section id="our-work" className="bg-surface py-20 lg:py-[104px]">
      <div className="shell">
        <SectionHead eyebrow="Our Work" title={`How ${site.name} transforms every school day`}>
          One connected platform replaces paper across the school. Here is how it works, and what changes for each role.
        </SectionHead>

        {/* How it works */}
        <ol className="grid gap-[18px] md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              className={`relative flex gap-4 rounded-[14px] border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.08)] sm:p-6 ${cardHover}`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-135 from-ink to-primary text-[1.05rem] font-extrabold text-surface">
                {i + 1}
              </span>
              <span>
                <strong className="mb-1 block text-[1.05rem]">{s.title}</strong>
                <span className="text-[.93rem] text-ink/60">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* Role by role */}
        <div className="mt-16 grid gap-8 lg:mt-20 lg:gap-10">
          {roles.map((r, ri) => (
            <div key={r.tag} className={`grid gap-5 lg:gap-6 ${ri === 1 ? "lg:grid-cols-[2fr_.9fr]" : "lg:grid-cols-[.9fr_2fr]"}`}>
              <div
                data-reveal
                className={`flex flex-col rounded-[22px] bg-linear-135 p-7 text-surface ${
                  ri === 1 ? "from-primary to-accent lg:order-last" : "from-ink to-primary"
                }`}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-[14px] border border-surface/25 bg-surface/15">
                    <Icon d={r.icon} className="size-6" />
                  </span>
                  <span className="rounded-full bg-surface px-3 py-1.5 text-[.82rem] font-bold text-primary">{r.tag}</span>
                </div>
                <h3 className="mb-2.5 text-[1.35rem] font-bold leading-tight">{r.title}</h3>
                <p className="mb-6 text-[.95rem] text-surface/80">{r.intro}</p>
                <div className="mt-auto rounded-xl border border-surface/20 bg-surface/10 p-3.5 text-[.85rem]">
                  <span className="mb-1 block text-[.7rem] font-bold uppercase tracking-[.12em] text-surface/70">Replaces</span>
                  {r.before}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {r.features.map((f, fi) => (
                  <article
                    key={f.title}
                    data-reveal
                    className={`rounded-[18px] border border-ink/10 bg-white p-6 shadow-[0_10px_30px_rgba(6,30,41,.08)] ${cardHover} ${
                      r.features.length % 2 === 1 && fi === r.features.length - 1 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <span className="mb-4 grid size-12 place-items-center rounded-[14px] bg-primary/10 text-primary">
                      <Icon d={f.icon} className="size-6" />
                    </span>
                    <h4 className="mb-1.5 text-[1.08rem] font-bold text-primary">{f.title}</h4>
                    <p className="text-[.93rem] text-ink/70">{f.text}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
