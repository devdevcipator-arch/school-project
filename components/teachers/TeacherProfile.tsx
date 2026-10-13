"use client";

import type { ReactNode } from "react";
import { Drawer, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { days, periods, weeklySchedule, type Teacher } from "@/lib/teachers";
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

export default function TeacherProfile({ t, onClose, onEdit }: { t: Teacher; onClose: () => void; onEdit: () => void }) {
  const schedule = weeklySchedule(t);
  const load = schedule.flat().filter(Boolean).length;

  return (
    <Drawer
      width="max-w-[760px]"
      title="Profile & Schedule"
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

          <dl className="grid gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-5 sm:grid-cols-2">
            <Info label="Official email">
              <a href={`mailto:${t.email}`} className="break-all text-primary hover:underline">
                {t.email}
              </a>
            </Info>
            <Info label="Phone">
              <a href={`tel:${t.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                {t.phone}
              </a>
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
        </div>
      )}
    </Drawer>
  );
}
