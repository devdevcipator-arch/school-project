"use client";

import { useCallback, useMemo, useState } from "react";
import { Select, Toast, fieldClass, ghostSm, type ToastData } from "@/components/dashboard/controls";
import ReportCard from "@/components/reports/ReportCard";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mySections, rosterOf } from "@/lib/classAttendance";
import { addReport, getReports, removeReport, restoreReports, useProgressReports } from "@/lib/progressReports";

const labelClass = "mb-1.5 block text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50";

/** Write a progress report for a student, and see every report written so far. */
export default function ReportsHub() {
  const reports = useProgressReports();
  const [section, setSection] = useState(mySections[0].section);
  const roster = useMemo(() => rosterOf(section), [section]);
  const [studentId, setStudentId] = useState(roster[0].id);
  const [timeFrame, setTimeFrame] = useState("");
  const [description, setDescription] = useState("");
  const [tried, setTried] = useState(false);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const s = roster.find((x) => x.id === studentId) ?? roster[0];
  const valid = timeFrame.trim() && description.trim();
  const shown = filter === "all" ? reports : reports.filter((r) => r.section === filter);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    addReport({ studentId: s.id, studentName: s.name, section, timeFrame: timeFrame.trim(), description: description.trim() });
    setTimeFrame("");
    setDescription("");
    setTried(false);
    setToast({ text: `Report saved for ${s.name}.` });
  };

  const remove = (id: string, name: string) => {
    const before = getReports();
    removeReport(id);
    setToast({ text: `Report for ${name} deleted.`, action: { label: "Undo", run: () => (restoreReports(before), setToast(null)) } });
  };

  return (
    <main className="mx-auto grid max-w-[1500px] items-start gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-6 lg:py-8">
      <form onSubmit={submit} noValidate className="grid gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6 lg:sticky lg:top-6">
        <h2 className="text-[1.05rem] font-extrabold tracking-tight">Create report</h2>

        <div>
          <span className={labelClass}>Class</span>
          <Select
            label="Class and section"
            value={section}
            onChange={(v) => {
              setSection(v);
              setStudentId(rosterOf(v)[0].id);
            }}
          >
            {mySections.map((x) => (
              <option key={x.section} value={x.section}>
                {x.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <span className={labelClass}>Student</span>
          <Select label="Student" value={s.id} onChange={setStudentId}>
            {roster.map((x) => (
              <option key={x.id} value={x.id}>
                #{String(x.rollNo).padStart(2, "0")} {x.name}
              </option>
            ))}
          </Select>
        </div>

        <label>
          <span className={labelClass}>Time frame</span>
          <input
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            placeholder="e.g. October 2026 or 1 Sep to 30 Sep 2026"
            className={`${fieldClass} w-full ${tried && !timeFrame.trim() ? "border-danger" : ""}`}
          />
        </label>

        <label>
          <span className={labelClass}>Performance description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={7}
            placeholder="How did the student perform in this period? Strengths, areas to improve, behaviour."
            className={`${fieldClass} w-full resize-y ${tried && !description.trim() ? "border-danger" : ""}`}
          />
        </label>

        {tried && !valid && <p className="text-[.8rem] font-semibold text-danger">Add a time frame and a description to save the report.</p>}

        <button type="submit" className={buttonClass("primary", "md", "w-full cursor-pointer")}>
          <Icon d="M5 12l4 4 10-10" className="size-[18px]" />
          Save Report
        </button>
      </form>

      <section className="grid min-w-0 gap-4 rounded-[20px] border border-ink/8 bg-white p-4 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[1.05rem] font-extrabold tracking-tight">
            All reports <span className="text-[.85rem] font-semibold text-ink/50">({shown.length})</span>
          </h2>
          <Select label="Filter by class" value={filter} onChange={setFilter} className="w-full sm:w-[240px]">
            <option value="all">All classes</option>
            {mySections.map((x) => (
              <option key={x.section} value={x.section}>
                {x.label}
              </option>
            ))}
          </Select>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 px-6 py-12 text-center text-[.88rem] text-ink/55">No reports yet. Create one with the form.</p>
        ) : (
          <div className="grid gap-3">
            {shown.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                showStudent
                action={
                  <button type="button" onClick={() => remove(r.id, r.studentName)} className={`${ghostSm} hover:!bg-danger/8 hover:!text-danger`} aria-label={`Delete report for ${r.studentName}`}>
                    <Icon d="M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3" className="size-4" />
                    Delete
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
