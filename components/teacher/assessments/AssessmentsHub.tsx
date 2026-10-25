"use client";

import { useCallback, useState } from "react";
import { Dialog, Select, Toast, fieldClass, ghostBtn, type ToastData } from "@/components/dashboard/controls";
import AssessmentsBoard, { kinds } from "@/components/student/assessments/AssessmentsBoard";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sectionSubjects } from "@/lib/assessments";
import { mySections } from "@/lib/classAttendance";
import { schoolToday, type AssessmentKind } from "@/lib/student";
import { teacherAssessments, teacherName, type ClassAssessment } from "@/lib/teacherAssessments";

const classColumn = { label: "Class", of: (a: ClassAssessment) => a.section };
const nextId = (list: ClassAssessment[]) => `AS-${Math.max(0, ...list.map((a) => Number(a.id.slice(3)) || 0)) + 1}`;

/** Teacher view of the student Assessments board: same list and columns, plus create and edit. */
export default function AssessmentsHub() {
  const [list, setList] = useState<ClassAssessment[]>(teacherAssessments);
  // null: closed, "new": creating, otherwise the assessment being edited.
  const [form, setForm] = useState<null | "new" | ClassAssessment>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const save = (a: ClassAssessment) => {
    const isNew = !list.some((x) => x.id === a.id);
    setList((l) => (isNew ? [a, ...l] : l.map((x) => (x.id === a.id ? a : x))));
    setForm(null);
    setToast({ text: isNew ? `"${a.title}" set for Class ${a.section}. Students can see it in their portal.` : `"${a.title}" updated.` });
  };

  return (
    <>
      <AssessmentsBoard
        items={list}
        who={classColumn}
        note="Students see exactly these details in their portal."
        onEdit={setForm}
        toolbar={
          <button type="button" onClick={() => setForm("new")} className={buttonClass("primary", "lg", "cursor-pointer max-sm:w-full")}>
            <Icon d="M12 5v14 M5 12h14" className="size-5" />
            Create Assessment
          </button>
        }
      />
      {form && <AssessmentForm key={form === "new" ? "new" : form.id} a={form === "new" ? undefined : form} id={nextId(list)} onSave={save} onClose={() => setForm(null)} />}
      {toast && <Toast {...toast} onDone={clearToast} />}
    </>
  );
}

const label = "grid gap-1.5 text-[.8rem] font-bold text-ink/70";

/** Only the fields a student sees: title, class, subject, type, assigned and due dates, and what to prepare. */
function AssessmentForm({ a, id, onSave, onClose }: { a?: ClassAssessment; id: string; onSave: (a: ClassAssessment) => void; onClose: () => void }) {
  const [title, setTitle] = useState(a?.title ?? "");
  const [section, setSection] = useState(a?.section ?? mySections[0].section);
  const [subject, setSubject] = useState(a?.subject ?? sectionSubjects(mySections[0].section)[0]);
  const [kind, setKind] = useState<AssessmentKind>(a?.kind ?? "Homework");
  const [assigned, setAssigned] = useState(a?.assigned ?? schoolToday);
  const [due, setDue] = useState(a?.due ?? schoolToday);
  const [details, setDetails] = useState(a?.details ?? "");
  const [tried, setTried] = useState(false);

  const subjects = sectionSubjects(section);
  const badDue = due < assigned;
  const bad = !title.trim() || !details.trim() || badDue;

  const submit = () => {
    setTried(true);
    if (bad) return;
    // Pushing the deadline later keeps the original date so students see "Extended from".
    const original = a?.extendedFrom ?? (a && due > a.due ? a.due : undefined);
    onSave({
      id: a?.id ?? id,
      title: title.trim(),
      section,
      subject,
      kind,
      teacher: teacherName,
      assigned,
      due,
      extendedFrom: original && due > original ? original : undefined,
      details: details.trim(),
    });
  };

  return (
    <Dialog label={a ? "Edit assessment" : "Create assessment"} onClose={onClose}>
      <h2 className="text-[1.2rem] font-extrabold tracking-tight">{a ? "Edit Assessment" : "Create Assessment"}</h2>
      <div className="mt-4 grid max-h-[65vh] gap-4 overflow-y-auto">
        <label className={label}>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Algebra Mid-Term Quiz" aria-invalid={tried && !title.trim()} className={`${fieldClass} ${tried && !title.trim() ? "border-danger" : ""}`} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Class
            <Select
              label="Class"
              value={section}
              onChange={(v) => {
                setSection(v);
                if (!sectionSubjects(v).includes(subject)) setSubject(sectionSubjects(v)[0]);
              }}
            >
              {mySections.map((s) => (
                <option key={s.section} value={s.section}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
          <label className={label}>
            Subject
            <Select label="Subject" value={subject} onChange={setSubject}>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </label>
        </div>
        <label className={label}>
          Type
          <Select label="Type" value={kind} onChange={(v) => setKind(v as AssessmentKind)}>
            {kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Assigned
            <input type="date" value={assigned} onChange={(e) => setAssigned(e.target.value)} className={fieldClass} />
          </label>
          <label className={label}>
            Due
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-invalid={tried && badDue} className={`${fieldClass} ${tried && badDue ? "border-danger" : ""}`} />
          </label>
        </div>
        {tried && badDue && <p className="-mt-2 text-[.8rem] font-semibold text-danger">The due date cannot be before the assigned date.</p>}
        <label className={label}>
          What to prepare
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="e.g. Chapters 3 to 5. 20 questions, 30 minutes."
            aria-invalid={tried && !details.trim()}
            className={`${fieldClass} resize-y ${tried && !details.trim() ? "border-danger" : ""}`}
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button type="button" onClick={submit} className={buttonClass("primary", "md", "flex-1 cursor-pointer")}>
          {a ? "Save Changes" : "Create Assessment"}
        </button>
        <button type="button" onClick={onClose} className={`${ghostBtn} flex-1`}>
          Cancel
        </button>
      </div>
    </Dialog>
  );
}
