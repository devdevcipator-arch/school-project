"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Drawer, ghostBtn } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { Avatar, SubjectPills } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AS_OF, DEFAULTER_BELOW, TERM_LABEL, attendanceLogs, classTeacherOf, sectionLabel, subjectsFor, tally, type Student } from "@/lib/students";
import AttendanceLogs from "./AttendanceLogs";
import { AttendanceMeter, StatusBadge } from "./parts";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
};
const ageOn = (dob: string, on: string) => Number(on.slice(0, 4)) - Number(dob.slice(0, 4)) - (on.slice(5) < dob.slice(5) ? 1 : 0);

function Info({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-[.9rem] font-semibold">{children}</dd>
    </div>
  );
}

export type StudentTab = "profile" | "attendance";

const tabs: [StudentTab, string, string][] = [
  ["profile", "Full Profile", "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"],
  ["attendance", "Attendance Logs", "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11"],
];

export default function StudentProfile({ s, tab: initialTab = "profile", onClose }: { s: Student; tab?: StudentTab; onClose: () => void }) {
  const [tab, setTab] = useState(initialTab);
  const lifetime = useMemo(() => tally(attendanceLogs(s, s.enrolled)), [s]);
  const other = tab === "profile" ? tabs[1] : tabs[0];

  return (
    <Drawer
      width="max-w-[760px]"
      title={tabs.find(([k]) => k === tab)![1]}
      subtitle={`${s.name} · ${sectionLabel(s.section)} · Roll No. ${s.rollNo}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Close
          </button>
          <button type="button" onClick={() => setTab(other[0])} className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1 sm:ml-auto")}>
            <Icon d={other[2]} className="size-[18px]" />
            {tab === "profile" ? "View Attendance Logs" : "Back to Full Profile"}
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
                Roll No. {s.rollNo} · {sectionLabel(s.section)} · Enrolled {longDate(s.enrolled)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={s.today} />
                {s.termRate < DEFAULTER_BELOW && <Badge tone="danger">Attendance below {DEFAULTER_BELOW}%</Badge>}
              </div>
            </div>
          </div>

          <div role="tablist" aria-label="Student sections" className="flex rounded-xl border border-ink/10 p-1">
            {tabs.map(([k, label, ic]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[.84rem] font-semibold transition-colors ${tab === k ? "bg-primary text-surface" : "text-ink/60 hover:text-primary"}`}
              >
                <Icon d={ic} className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === "attendance" ? (
            <AttendanceLogs s={s} />
          ) : (
            <>
              <section>
                <h3 className="mb-3 text-[1rem] font-extrabold tracking-tight">Personal & guardian details</h3>
                <dl className="grid gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-5 sm:grid-cols-2">
                  <Info label="Date of birth">
                    {longDate(s.dob)} <span className="font-normal text-ink/50">({ageOn(s.dob, AS_OF)} years)</span>
                  </Info>
                  <Info label="Gender">{s.gender}</Info>
                  <Info label="Registration ID">{s.regId}</Info>
                  <Info label={`Guardian (${s.guardianRelation})`}>{s.guardian}</Info>
                  <Info label="Guardian email">
                    <a href={`mailto:${s.email}`} className="break-all text-primary hover:underline">
                      {s.email}
                    </a>
                  </Info>
                  <Info label="Emergency contact">
                    <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                      {s.phone}
                    </a>
                  </Info>
                  <Info label="Residential address" wide>
                    {s.address}
                  </Info>
                </dl>
              </section>

              <section>
                <h3 className="mb-3 text-[1rem] font-extrabold tracking-tight">Academic snapshot</h3>
                <dl className="grid gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-5 sm:grid-cols-2">
                  <Info label="Class & section">{sectionLabel(s.section)}</Info>
                  <Info label="Class teacher">{classTeacherOf(s.section)}</Info>
                  <Info label="Enrolled subjects" wide>
                    <SubjectPills subjects={subjectsFor(s)} />
                  </Info>
                </dl>
              </section>

              <section>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <h3 className="text-[1rem] font-extrabold tracking-tight">Attendance summary</h3>
                  <p className="text-[.8rem] text-ink/55">{TERM_LABEL}</p>
                </div>
                <div className="grid gap-4 rounded-2xl border border-ink/8 p-5">
                  <dl className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Present days", value: s.term.present, cls: "text-ok" },
                      { label: "Absent days", value: s.term.absent, cls: "text-danger" },
                      { label: "Leaves taken", value: s.term.leave, cls: "text-[#9a6a0f]" },
                    ].map((t) => (
                      <div key={t.label} className="rounded-2xl bg-surface/60 p-3.5">
                        <dt className="text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/45">{t.label}</dt>
                        <dd className={`mt-1 text-[1.35rem] font-extrabold tracking-tight ${t.cls}`}>{t.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <AttendanceMeter rate={s.termRate} name={s.name} />
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/8 pt-3.5 text-[.82rem] text-ink/60">
                    <strong className="text-ink">Since enrollment ({longDate(s.enrolled)}):</strong>
                    <span>{lifetime.rate}% over {lifetime.total} school days</span>
                    <span>{lifetime.absent} absences</span>
                    <span>{lifetime.leave} leaves</span>
                    <button type="button" onClick={() => setTab("attendance")} className="cursor-pointer font-bold text-primary hover:text-accent">
                      View all records
                    </button>
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}
