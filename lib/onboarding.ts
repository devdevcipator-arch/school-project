// School onboarding: the one-time setup a principal completes before the portals go live.
// Collects exactly the school-level settings the platform reads today, nothing more:
// school identity, calendar, timings, classes, subjects, fee rules (status only, no amounts)
// and attendance / grading thresholds. Teachers and students are added later from their own boards.
// Front-end phase: defaults mirror the current mock constants; replace with the API in the backend phase.

import { teachers } from "./teachers";

export type Holiday = { id: string; name: string; from: string; to: string };
export type BellPeriod = { id: string; label: string; start: string; end: string; isBreak: boolean };
export type GradeSetup = { grade: number; on: boolean; sections: number };
export type SubjectSetup = { id: string; name: string; department: string; from: number; to: number };
export type FeePlan = "monthly" | "biannual" | "annual";
export type GradeBand = { letter: string; min: number };

export type Onboarding = {
  school: { name: string; principal: string; idPrefix: string };
  calendar: { yearStartMonth: number; termName: string; termStart: string; examTerms: string[]; schoolDays: number[]; holidays: Holiday[] };
  timings: { start: string; end: string; periods: BellPeriod[] };
  grades: GradeSetup[];
  departments: string[];
  subjects: SubjectSetup[];
  fees: { plans: FeePlan[]; dueDay: number; defaulterMonths: number };
  policies: { studentAttendanceBelow: number; classAttendanceBelow: number; scale: GradeBand[] };
};

export const steps = [
  { key: "school", label: "School", hint: "Name and principal" },
  { key: "calendar", label: "Calendar", hint: "Year, terms, holidays" },
  { key: "timings", label: "Timings", hint: "School hours and periods" },
  { key: "classes", label: "Classes", hint: "Grades and sections" },
  { key: "subjects", label: "Subjects", hint: "Subjects and departments" },
  { key: "fees", label: "Fees", hint: "Plans and due dates" },
  { key: "policies", label: "Policies", hint: "Attendance and grading" },
  { key: "review", label: "Review", hint: "Check and finish" },
] as const;
export type StepKey = (typeof steps)[number]["key"];

export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const weekdays = [
  { n: 1, short: "Mon" },
  { n: 2, short: "Tue" },
  { n: 3, short: "Wed" },
  { n: 4, short: "Thu" },
  { n: 5, short: "Fri" },
  { n: 6, short: "Sat" },
  { n: 0, short: "Sun" },
];
export const feePlans: { key: FeePlan; label: string; hint: string }[] = [
  { key: "monthly", label: "Monthly", hint: "One installment every month" },
  { key: "biannual", label: "Bi-annual", hint: "Installment 1 and 2" },
  { key: "annual", label: "Annual", hint: "One installment for the year" },
];
export const sectionLetters = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

let n = 0;
export const uid = (p: string) => `${p}${Date.now().toString(36)}${(n++).toString(36)}`;

/** Sections per grade as the current class-teacher roster has them, e.g. Grade 10 has A, B, C. */
const sectionCount = (g: number) => teachers.filter((t) => t.classTeacher && parseInt(t.classTeacher) === g).length;

const subject = (name: string, department: string, from: number, to: number): SubjectSetup => ({ id: `sub-${name}`, name, department, from, to });

export const defaults: Onboarding = {
  school: { name: "", principal: "", idPrefix: "" },
  calendar: {
    yearStartMonth: 4,
    termName: "Autumn term 2026",
    termStart: "2026-08-03",
    examTerms: ["First Term Exam", "Mid-Term Review", "Final Semester"],
    schoolDays: [1, 2, 3, 4, 5],
    holidays: [
      { id: "h1", name: "Independence Day", from: "2026-08-14", to: "2026-08-14" },
      { id: "h2", name: "Eid Milad-un-Nabi", from: "2026-08-26", to: "2026-08-26" },
      { id: "h3", name: "Winter break", from: "2026-12-22", to: "2026-12-31" },
      { id: "h4", name: "Summer break", from: "2027-06-01", to: "2027-07-31" },
    ],
  },
  timings: {
    start: "08:00",
    end: "14:30",
    periods: [
      { id: "p1", label: "Period 1", start: "08:00", end: "08:45", isBreak: false },
      { id: "p2", label: "Period 2", start: "08:45", end: "09:30", isBreak: false },
      { id: "p3", label: "Period 3", start: "09:30", end: "10:15", isBreak: false },
      { id: "p4", label: "Break", start: "10:15", end: "10:35", isBreak: true },
      { id: "p5", label: "Period 4", start: "10:35", end: "11:20", isBreak: false },
      { id: "p6", label: "Period 5", start: "11:20", end: "12:05", isBreak: false },
      { id: "p7", label: "Period 6", start: "12:05", end: "12:50", isBreak: false },
      { id: "p8", label: "Period 7", start: "12:50", end: "13:30", isBreak: false },
    ],
  },
  grades: Array.from({ length: 10 }, (_, i) => ({ grade: i + 1, on: true, sections: Math.max(1, sectionCount(i + 1)) })),
  departments: ["Science", "Mathematics", "Humanities", "Languages", "Computer Science", "Sports", "Administrative Staff"],
  subjects: [
    subject("English", "Languages", 1, 10),
    subject("Urdu", "Languages", 1, 10),
    subject("Mathematics", "Mathematics", 1, 10),
    subject("Islamiyat", "Humanities", 1, 10),
    subject("General Science", "Science", 1, 8),
    subject("Art", "Humanities", 1, 3),
    subject("Social Studies", "Humanities", 4, 8),
    subject("Computer Science", "Computer Science", 4, 10),
    subject("Physics", "Science", 9, 10),
    subject("Chemistry", "Science", 9, 10),
    subject("Biology", "Science", 9, 10),
    subject("Pakistan Studies", "Humanities", 9, 10),
    subject("Physical Education", "Sports", 1, 10),
  ],
  fees: { plans: ["monthly", "biannual", "annual"], dueDay: 15, defaulterMonths: 2 },
  policies: {
    studentAttendanceBelow: 75,
    classAttendanceBelow: 80,
    scale: [
      { letter: "A+", min: 90 },
      { letter: "A", min: 80 },
      { letter: "B", min: 70 },
      { letter: "C", min: 60 },
      { letter: "D", min: 50 },
    ],
  },
};

export type Errors = Record<string, string>;

const timeOk = (s: string, e: string) => !!s && !!e && s < e;

/** Problems on one step, keyed by field id so the first one can be focused. */
export function validateStep(key: StepKey, d: Onboarding): Errors {
  const e: Errors = {};
  if (key === "school") {
    if (d.school.name.trim().length < 3) e["ob-name"] = "Enter the school's full name.";
    if (d.school.principal.trim().length < 3) e["ob-principal"] = "Enter the principal's full name.";
    if (!/^[A-Z]{2,5}$/.test(d.school.idPrefix)) e["ob-prefix"] = "Use 2 to 5 capital letters, e.g. GPS.";
  }
  if (key === "calendar") {
    if (!d.calendar.termName.trim()) e["ob-term"] = "Name the current term.";
    if (!d.calendar.termStart) e["ob-term-start"] = "Pick the date the term started.";
    if (!d.calendar.examTerms.some((t) => t.trim())) e["ob-exam-0"] = "Add at least one exam term.";
    if (!d.calendar.schoolDays.length) e["ob-days"] = "Pick at least one school day.";
    d.calendar.holidays.forEach((h) => {
      if (!h.name.trim()) e[`ob-hol-${h.id}`] = "Name this holiday or remove it.";
      else if (!h.from || !h.to || h.to < h.from) e[`ob-hol-${h.id}`] = "The end date must be on or after the start date.";
    });
  }
  if (key === "timings") {
    if (!timeOk(d.timings.start, d.timings.end)) e["ob-start"] = "School must end after it starts.";
    if (!d.timings.periods.some((p) => !p.isBreak)) e["ob-periods"] = "Add at least one teaching period.";
    d.timings.periods.forEach((p, i) => {
      const prev = d.timings.periods[i - 1];
      if (!p.label.trim()) e[`ob-per-${p.id}`] = "Name this period.";
      else if (!timeOk(p.start, p.end)) e[`ob-per-${p.id}`] = "The period must end after it starts.";
      else if (prev && p.start < prev.end) e[`ob-per-${p.id}`] = `Overlaps with ${prev.label || "the period above"}.`;
      else if (p.start < d.timings.start || p.end > d.timings.end) e[`ob-per-${p.id}`] = "Keep periods inside school hours.";
    });
  }
  if (key === "classes" && !d.grades.some((g) => g.on)) e["ob-grade-1"] = "Turn on at least one grade.";
  if (key === "subjects") {
    if (!d.departments.length) e["ob-dept"] = "Add at least one department.";
    if (!d.subjects.length) e["ob-subjects"] = "Add at least one subject.";
    const seen = new Set<string>();
    d.subjects.forEach((s) => {
      const k = s.name.trim().toLowerCase();
      if (!k) e[`ob-sub-${s.id}`] = "Name this subject or remove it.";
      else if (seen.has(k)) e[`ob-sub-${s.id}`] = "This subject is listed twice.";
      else if (s.from > s.to) e[`ob-sub-${s.id}`] = "The first grade must be at or below the last grade.";
      seen.add(k);
    });
  }
  if (key === "fees" && !d.fees.plans.length) e["ob-plan-monthly"] = "Offer at least one fee plan.";
  if (key === "policies") {
    d.policies.scale.forEach((b, i) => {
      const prev = d.policies.scale[i - 1];
      if (prev && b.min >= prev.min) e[`ob-band-${i}`] = `Must be lower than ${prev.letter} (${prev.min}%).`;
    });
  }
  return e;
}

export const sectionTotal = (d: Onboarding) => d.grades.filter((g) => g.on).reduce((t, g) => t + g.sections, 0);
export const shortDay = (iso: string) => (iso ? `${Number(iso.slice(8, 10))} ${monthNames[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${iso.slice(0, 4)}` : "");
export const ampm = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
