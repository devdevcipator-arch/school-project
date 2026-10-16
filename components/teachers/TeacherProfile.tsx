"use client";

import { useState, type ReactNode } from "react";
import { Drawer, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { days, periods, weeklySchedule, type Teacher } from "@/lib/teachers";
import AttendanceHistory from "./AttendanceHistory";
import { Avatar, CheckInChip, ScopeBadges, StatusBadge, SubjectPills } from "./parts";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
};

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-[.9rem] font-semibold">{children}</dd>
    </div>
  );
}

export type ProfileTab = "profile" | "attendance";

const tabs: [ProfileTab, string, string][] = [
  ["profile", "Profile & Schedule", "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"],
  ["attendance", "Attendance Records", "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11"],
];

export default function TeacherProfile({
  t,
  tab: initialTab = "profile",
  onClose,
  onEdit,
}: {
  t: Teacher;
  tab?: ProfileTab;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const schedule = weeklySchedule(t);
  const load = schedule.flat().filter(Boolean).length;

  return (
    <Drawer
      width="max-w-[760px]"
      title={tabs.find(([k]) => k === tab)![1]}
      subtitle={`${t.name} · ${t.empId}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Close
          </button>
          <button type="button" onClick={onEdit} className={buttonClass("primary", "md", "cursor-pointer max-sm:flex-1 sm:ml-auto")}>
            <Icon d="M4 20h4L19 9l-4-4L4 16z M13 7l4 4" className="size-[18px]" />
            Edit Details / Class Assignment
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={t.name} size="lg" muted={t.status === "inactive"} />
            <div className="min-w-0 flex-1">
              <p className="text-[1.25rem] font-extrabold tracking-tight">{t.name}</p>
              <p className="text-[.84rem] text-ink/55">
                {t.empId} · Joined {longDate(t.joined)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={t.status} />
                <CheckInChip checkIn={t.checkIn} />
              </div>
            </div>
          </div>

          <div role="tablist" aria-label="Profile sections" className="flex rounded-xl border border-ink/10 p-1">
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
            <AttendanceHistory t={t} />
          ) : (
            <>
          <dl className="grid gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-5 sm:grid-cols-2">
            <Info label="Official email">
              <a href={`mailto:${t.email}`} className="break-all text-primary hover:underline">
                {t.email}
              </a>
            </Info>
            <Info label="Phone">
              {t.phone ? (
                <a href={`tel:${t.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                  {t.phone}
                </a>
              ) : (
                <span className="text-ink/50">Not added yet</span>
              )}
            </Info>
            <Info label="Academic scope">
              <ScopeBadges t={t} />
            </Info>
            <Info label="Subjects">
              <SubjectPills subjects={t.subjects} />
            </Info>
          </dl>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-[1rem] font-extrabold tracking-tight">Weekly schedule</h3>
              <p className="text-[.8rem] text-ink/55">{load} periods / week</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-ink/8">
              <table className="w-full min-w-[560px] border-collapse text-center text-[.76rem]">
                <thead className="bg-surface/70 text-[.7rem] font-bold uppercase tracking-[.08em] text-ink/50">
                  <tr>
                    <th scope="col" className="px-2 py-2.5 text-left">
                      Day
                    </th>
                    {periods.map((p, i) => (
                      <th key={p} scope="col" className="px-1.5 py-2.5">
                        P{i + 1}
                        <span className="block font-semibold normal-case tracking-normal text-ink/40">{p}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((d, di) => (
                    <tr key={d} className="border-t border-ink/8">
                      <th scope="row" className="px-2 py-2 text-left text-[.8rem] font-bold">
                        {d}
                      </th>
                      {schedule[di].map((slot, pi) => (
                        <td key={pi} className="p-1">
                          {slot ? (
                            <span className="grid rounded-lg bg-primary/8 px-1.5 py-1.5">
                              <span className="truncate font-bold text-primary">{slot.cls}</span>
                              <span className="truncate text-[.68rem] text-ink/60">{slot.subject}</span>
                            </span>
                          ) : (
                            <span className="grid rounded-lg border border-dashed border-ink/10 py-2.5 text-[.68rem] text-ink/35">Free</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[.76rem] text-ink/45">Preview timetable. Final schedules come from the timetable module.</p>
          </section>
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}
