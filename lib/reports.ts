// Teacher portal, Reports: term report cards compiled from marks and attendance.
// Marks are deterministic mock data; "Auto-Compile" stands in for pulling real assessment scores later.

import { sectionSubjects } from "./assessments";
import { hash, type Student } from "./students";

export type TermId = "first-2026" | "mid-2026" | "final-2026";

export const terms: { id: TermId; label: string; short: string }[] = [
  { id: "first-2026", label: "First Term Exam 2026", short: "First Term 2026" },
  { id: "mid-2026", label: "Mid-Term Review", short: "Mid-Term Review" },
  { id: "final-2026", label: "Final Semester", short: "Final Semester" },
];

export const SUBJECT_MAX = 100;

export type SubjectMark = { subject: string; max: number; obtained: number | null; remark: string };
export type Trend = "improving" | "consistent" | "attention";
export type ReportStatus = "ready" | "draft" | "sent";

export type Report = {
  studentId: string;
  marks: SubjectMark[];
  /** Overall percentage last term, for the trend chip. */
  previous: number;
  remark: string;
  sentAt?: string;
};

export const remarkPresets = [
  "Excellent analytical thinking",
  "Active participant in class",
  "Consistent and hardworking",
  "Needs focus in Algebra",
  "Should revise more regularly",
  "Great improvement this term",
];

export function letterGrade(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/** 4.0 scale used on the printed card. */
export const gpaOf = (pct: number) => (pct >= 90 ? 4 : pct >= 80 ? 3.7 : pct >= 70 ? 3.3 : pct >= 60 ? 3 : pct >= 50 ? 2 : 1);

const subjectRemark = (pct: number) =>
  pct >= 90 ? "Outstanding grasp of concepts" : pct >= 80 ? "Very good, keep it up" : pct >= 70 ? "Good work, minor gaps" : pct >= 60 ? "Satisfactory, practise more" : pct >= 50 ? "Needs regular revision" : "Requires extra support";

export function totals(r: Report) {
  const done = r.marks.filter((m) => m.obtained !== null);
  const max = r.marks.reduce((t, m) => t + m.max, 0);
  const got = done.reduce((t, m) => t + (m.obtained ?? 0), 0);
  const pct = done.length ? Math.round((got / done.reduce((t, m) => t + m.max, 0)) * 1000) / 10 : 0;
  return { max, got, pct, missing: r.marks.length - done.length, grade: letterGrade(pct), gpa: gpaOf(pct) };
}

export function trendOf(r: Report): Trend {
  const d = totals(r).pct - r.previous;
  return d >= 3 ? "improving" : d <= -3 || totals(r).pct < 60 ? "attention" : "consistent";
}

export const statusOf = (r: Report): ReportStatus => (r.sentAt ? "sent" : totals(r).missing === 0 && r.remark.trim() ? "ready" : "draft");

const termSalt: Record<TermId, number> = { "first-2026": 11, "mid-2026": 23, "final-2026": 37 };

function markFor(s: Student, subject: string, term: TermId) {
  const k = subject.length * 13 + termSalt[term];
  const ability = 0.34 + (s.termRate / 100) * 0.3 + hash(s.seed, k) * 0.36;
  return Math.max(28, Math.min(SUBJECT_MAX, Math.round(SUBJECT_MAX * ability)));
}

/** Reports as they stand at the start: the mid-term is already dispatched, the first term is mid-draft, the final is not compiled. */
export function seedReports(roster: Student[], section: string, term: TermId): Report[] {
  const subjects = sectionSubjects(section);
  return roster.map((s, i) => {
    const marks = subjects.map((subject, j) => {
      const obtained = markFor(s, subject, term);
      // First term: a few students still miss one subject mark; final: nothing compiled yet.
      const missing = term === "final-2026" || (term === "first-2026" && hash(s.seed, 300 + j) < 0.035);
      return { subject, max: SUBJECT_MAX, obtained: missing ? null : obtained, remark: missing ? "" : subjectRemark(obtained) };
    });
    const r: Report = { studentId: s.id, marks, previous: 0, remark: "" };
    const pct = totals(r).pct || 70;
    r.previous = Math.max(35, Math.min(98, Math.round(pct + (hash(s.seed, 400 + termSalt[term]) - 0.5) * 14)));
    if (term === "mid-2026") {
      r.remark = remarkPresets[i % 3];
      r.sentAt = "2026-09-12T10:30:00.000Z";
    } else if (term === "first-2026" && hash(s.seed, 500) > 0.22) {
      r.remark = suggestFeedback(s, r);
    }
    return r;
  });
}

/** Fills every missing mark from the recorded assessments (mocked) and adds subject remarks. */
export function compile(r: Report, s: Student, term: TermId): Report {
  return {
    ...r,
    marks: r.marks.map((m) => {
      if (m.obtained !== null) return m;
      const obtained = markFor(s, m.subject, term);
      return { ...m, obtained, remark: subjectRemark(obtained) };
    }),
  };
}

/** Mock "AI": two constructive sentences from the student's marks and attendance. */
export function suggestFeedback(s: Student, r: Report) {
  const done = r.marks.filter((m) => m.obtained !== null);
  if (!done.length) return "";
  const best = done.reduce((a, b) => ((b.obtained ?? 0) > (a.obtained ?? 0) ? b : a));
  const worst = done.reduce((a, b) => ((b.obtained ?? 0) < (a.obtained ?? 0) ? b : a));
  const { pct } = totals(r);
  const first = s.name.split(" ")[0];
  const opener =
    pct >= 85
      ? `${first} has delivered an excellent term, with particular strength in ${best.subject} (${best.obtained}%).`
      : pct >= 70
        ? `${first} has made solid progress this term and performs best in ${best.subject} (${best.obtained}%).`
        : `${first} is working steadily and shows the most promise in ${best.subject} (${best.obtained}%).`;
  const focus =
    s.termRate < 80
      ? `Improving attendance (currently ${s.termRate}%) and regular revision in ${worst.subject} will lift the overall result.`
      : worst.obtained !== null && worst.obtained < 65
        ? `More practice in ${worst.subject} (${worst.obtained}%) is the key next step, ideally with weekly revision.`
        : `Keeping up this consistency while stretching further in ${worst.subject} will build on these results.`;
  return `${opener} ${focus}`;
}
