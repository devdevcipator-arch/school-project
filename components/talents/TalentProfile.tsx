"use client";

import type { ReactNode } from "react";
import { Drawer, ghostBtn } from "@/components/dashboard/controls";
import { AttendanceMeter, StatusBadge } from "@/components/students/parts";
import { Avatar, SubjectPills } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TERM_LABEL, classTeacherOf, sectionLabel, subjectsFor } from "@/lib/students";
import { competitions, shortDate, type Talent } from "@/lib/talents";
import { LevelBadge, PrimaryTalent, SkillChips, categoryTone, trophyIcon } from "./parts";

function Info({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-[.9rem] font-semibold">{children}</dd>
    </div>
  );
}

const resultTone = (result: string) =>
  /gold|winner|best/i.test(result) ? "bg-linear-135 from-[#b8860b] to-[#e0b23a] text-ink" : /runner|bronze|semi/i.test(result) ? "bg-primary/10 text-primary" : "bg-ink/6 text-ink/60";

export default function TalentProfile({
  t,
  shortlistedFor,
  onShortlist,
  onCertificate,
  onClose,
}: {
  t: Talent;
  shortlistedFor?: string;
  onShortlist: () => void;
  onCertificate: () => void;
  onClose: () => void;
}) {
  const s = t.student;
  const event = competitions.find((c) => c.id === shortlistedFor);

  return (
    <Drawer
      width="max-w-[760px]"
      title="Student Talent Profile"
      subtitle={`${s.name} · ${sectionLabel(s.section)} · Roll No. ${s.rollNo}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Close
          </button>
          <button type="button" onClick={onCertificate} className={buttonClass("dark", "md", "cursor-pointer max-sm:flex-1 sm:ml-auto")}>
            <Icon d="M6 9V3h12v6 M6 18H4v-7h16v7h-2 M7 14h10v7H7z" className="size-[18px]" />
            Print Certificate
          </button>
          <button type="button" onClick={onShortlist} className={buttonClass("primary", "md", "cursor-pointer max-sm:w-full")}>
            <Icon d={event ? "M6 6l12 12 M18 6 6 18" : "M12 5v14 M5 12h14"} className="size-[18px]" />
            {event ? "Remove from Shortlist" : "Shortlist for Event"}
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={s.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[1.25rem] font-extrabold tracking-tight">{s.name}</p>
              <p className="text-[.84rem] text-ink/55">
                {s.regId} · {sectionLabel(s.section)} · Roll No. {s.rollNo}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <PrimaryTalent {...t.primary} />
                <LevelBadge level={t.level} />
              </div>
            </div>
          </div>

          {event && (
            <p className="flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/6 px-4 py-3 text-[.86rem] text-primary">
              <Icon d="M5 12l4 4 10-10" className="size-5 shrink-0" />
              <span>
                Shortlisted for <strong>{event.title}</strong> on {shortDate(event.date)}.
              </span>
            </p>
          )}

          <section>
            <h3 className="mb-3 text-[1rem] font-extrabold tracking-tight">Talent overview</h3>
            <dl className="grid gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-5 sm:grid-cols-2">
              <Info label="Primary talent">
                {t.primary.skill} {t.primary.role && <span className="font-normal text-ink/55">({t.primary.role})</span>}
              </Info>
              <Info label="Category">{t.primary.category}</Info>
              <Info label="Key achievement" wide>
                <span className="inline-flex items-start gap-2">
                  <Icon d={trophyIcon} className="mt-0.5 size-4 shrink-0 text-[#b8860b]" />
                  {t.achievement}
                </span>
              </Info>
              <Info label="Additional skills" wide>
                {t.extra.length ? <SkillChips list={t.extra} /> : <span className="font-normal text-ink/50">None recorded</span>}
              </Info>
            </dl>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-[1rem] font-extrabold tracking-tight">Talent history</h3>
              <p className="text-[.8rem] text-ink/55">
                {t.history.length} {t.history.length === 1 ? "event" : "events"}
              </p>
            </div>
            <ol className="relative grid gap-3 before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-ink/10">
              {t.history.map((h, i) => (
                <li key={`${h.date}-${i}`} className="relative grid grid-cols-[24px_1fr] gap-3">
                  <span className={`relative z-10 mt-4 size-[11px] justify-self-center rounded-full ring-4 ring-white ${categoryTone(h.category).dot}`} />
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-ink/8 bg-white p-3.5">
                    <div className="min-w-0">
                      <p className="font-bold">{h.title}</p>
                      <p className="text-[.78rem] text-ink/55">
                        {shortDate(h.date)} · {h.scope} level · {h.skill}
                      </p>
                    </div>
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[.72rem] font-bold ${resultTone(h.result)}`}>{h.result}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="mb-3 text-[1rem] font-extrabold tracking-tight">Mentor & teacher remarks</h3>
            <div className="grid gap-3">
              {t.remarks.map((r) => (
                <figure key={`${r.by}-${r.date}`} className="rounded-2xl border border-ink/8 bg-surface/50 p-5">
                  <blockquote className="text-[.9rem] leading-relaxed text-ink/80">&ldquo;{r.text}&rdquo;</blockquote>
                  <figcaption className="mt-3 flex flex-wrap items-center gap-x-2 text-[.8rem] text-ink/55">
                    <strong className="text-ink">{r.by}</strong>
                    <span>{r.role}</span>
                    <span>· {shortDate(r.date)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[1rem] font-extrabold tracking-tight">Academic & attendance record</h3>
            <dl className="grid gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-5 sm:grid-cols-2">
              <Info label="Class & section">{sectionLabel(s.section)}</Info>
              <Info label="Class teacher">{classTeacherOf(s.section)}</Info>
              <Info label="Guardian">
                {s.guardian} <span className="font-normal text-ink/50">({s.guardianRelation})</span>
              </Info>
              <Info label="Today">
                <StatusBadge status={s.today} />
              </Info>
              <Info label="Enrolled subjects" wide>
                <SubjectPills subjects={subjectsFor(s)} />
              </Info>
              <Info label={`Attendance, ${TERM_LABEL}`} wide>
                <AttendanceMeter rate={s.termRate} name={s.name} />
              </Info>
            </dl>
          </section>
        </div>
      )}
    </Drawer>
  );
}
