"use client";

import type { ReactNode } from "react";
import { Drawer, ghostBtn } from "@/components/dashboard/controls";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sectionLabel } from "@/lib/students";
import { levelOf, type Talent } from "@/lib/talents";

function Tags({ list }: { list: string[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {list.map((x) => (
        <span key={x} className="rounded-full bg-primary/10 px-3 py-1 text-[.82rem] font-semibold text-primary">
          {x}
        </span>
      ))}
    </span>
  );
}

function Info({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-[.72rem] font-bold uppercase tracking-[.1em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-[.9rem] font-semibold">{children}</dd>
    </div>
  );
}

/** Shows exactly what the Endorse / Tag Student Skill form records, under the same labels. */
export default function TalentProfile({ t, onCertificate, onClose }: { t: Talent; onCertificate: () => void; onClose: () => void }) {
  const s = t.student;
  // Skills tagged in the same category sit with the primary skill; others are listed separately.
  const sameCat = t.extra.filter((g) => g.category === t.primary.category);
  const otherCat = t.extra.filter((g) => g.category !== t.primary.category);

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
        </>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7">
          <div className="flex items-center gap-4">
            <Avatar name={s.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[1.25rem] font-extrabold tracking-tight">{s.name}</p>
              <p className="text-[.84rem] text-ink/55">
                {sectionLabel(s.section)} · Roll {s.rollNo} · {s.regId}
              </p>
            </div>
          </div>

          <dl className="grid gap-4 rounded-2xl border border-ink/8 bg-surface/50 p-5 sm:grid-cols-2">
            <Info label="Talent category">{t.primary.category}</Info>
            <Info label="Specific skill">
              <Tags list={[t.primary.skill, ...sameCat.map((g) => g.skill)]} />
            </Info>
            {t.primary.role && <Info label="Position / specialisation">{t.primary.role}</Info>}
            <Info label="Proficiency / honor level">{levelOf(t.level).label}</Info>
            {t.achievements.length > 0 && (
              <Info label="Achievement / honor" wide>
                <Tags list={t.achievements} />
              </Info>
            )}
            {t.remarks.length > 0 && (
              <Info label="Coach or coordinator remark" wide>
                <span className="grid gap-2 font-normal leading-relaxed text-ink/80">
                  {t.remarks.map((r, i) => (
                    <span key={i}>{r.text}</span>
                  ))}
                </span>
              </Info>
            )}
            {otherCat.length > 0 && (
              <Info label="Other endorsed skills" wide>
                {otherCat.map((g) => `${g.skill} (${g.category})`).join(", ")}
              </Info>
            )}
          </dl>
        </div>
      )}
    </Drawer>
  );
}
