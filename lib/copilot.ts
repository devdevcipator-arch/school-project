// Principal AI Copilot: knowledge vault, audit trail and a front-end intent engine that answers
// from the platform's own records. Replace `respond` with the LLM + tool-calling API in the backend
// phase; the reply shape (text, blocks, sources, draft action) is what the UI renders.
// Platform rule: no money amounts or currency anywhere, fees are status and behavior only.

import { notices } from "./announcements";
import { CURRENT_PERIOD, DEFAULTER_MONTHS, accounts, behaviorFor, behaviorOf, periods, recordFor, unpaidMonths } from "./fees";
import { DEFAULTER_BELOW, classTeacherOf, sectionLabel, sections, students, type Student } from "./students";
import { categoriesOf, levelOf, levelRank, skillsOf, talents } from "./talents";
import { emailFor, subjects, teachers, type Teacher } from "./teachers";

/* ---------------- Knowledge vault ---------------- */

export type DocCategory = "Textbook" | "Syllabus" | "Handbook" | "Policy";
export const docCategories: DocCategory[] = ["Textbook", "Syllabus", "Handbook", "Policy"];

export type DocStatus = "uploading" | "parsing" | "embedding" | "indexed" | "failed";

export type VaultDoc = {
  id: string;
  title: string;
  file: string;
  category: DocCategory;
  subject?: string;
  grade?: string;
  pages: number;
  /** Bytes. */
  size: number;
  uploaded: string;
  status: DocStatus;
  /** 0-100 while processing. */
  progress: number;
  /** Indexed passages the copilot can cite. */
  passages: { page: number; text: string }[];
  keywords: string[];
};

export const seedVault: VaultDoc[] = [
  {
    id: "d1",
    title: "Mathematics Grade 9 (Punjab Textbook Board)",
    file: "PCTB-Mathematics-Grade-9.pdf",
    category: "Textbook",
    subject: "Mathematics",
    grade: "Grade 9",
    pages: 312,
    size: 18_400_000,
    uploaded: "2026-08-02",
    status: "indexed",
    progress: 100,
    keywords: ["mathematics", "math", "maths", "grade 9", "algebra", "matrices", "quadratic", "logarithm", "sets"],
    passages: [
      { page: 12, text: "Unit 1 introduces matrices and determinants: order of a matrix, equality, addition, multiplication and the inverse of a 2 x 2 matrix." },
      { page: 58, text: "Unit 3 covers logarithms: scientific notation, laws of logarithms and their use in calculations." },
      { page: 141, text: "Unit 6 develops factorisation, including the factor theorem and factorising cubic polynomials." },
    ],
  },
  {
    id: "d2",
    title: "Physics Grade 10 (Punjab Textbook Board)",
    file: "PCTB-Physics-Grade-10.pdf",
    category: "Textbook",
    subject: "Physics",
    grade: "Grade 10",
    pages: 248,
    size: 21_900_000,
    uploaded: "2026-08-02",
    status: "indexed",
    progress: 100,
    keywords: ["physics", "grade 10", "waves", "sound", "light", "electricity", "electromagnetism", "optics"],
    passages: [
      { page: 9, text: "Chapter 10 (Simple Harmonic Motion and Waves) defines oscillation, damping and the wave equation v = f x lambda." },
      { page: 77, text: "Chapter 12 (Geometrical Optics) covers reflection, refraction, total internal reflection and lens formulas." },
      { page: 133, text: "Chapter 14 (Current Electricity) introduces Ohm's law, series and parallel circuits and electrical power." },
    ],
  },
  {
    id: "d3",
    title: "Annual Syllabus & Pacing Plan 2026-27",
    file: "Annual-Syllabus-Pacing-2026-27.pdf",
    category: "Syllabus",
    pages: 64,
    size: 2_300_000,
    uploaded: "2026-07-20",
    status: "indexed",
    progress: 100,
    keywords: ["syllabus", "pacing", "plan", "term", "unit", "schedule", "curriculum", "mid-term", "coverage"],
    passages: [
      { page: 6, text: "By the end of October, Grade 9 Mathematics should complete Units 1 to 3 (Matrices, Real Numbers, Logarithms); Unit 4 begins in the first week of November." },
      { page: 14, text: "Grade 10 Physics: Chapters 10 and 11 are first-term content; Chapter 12 (Optics) starts after the mid-term examination on 26 October." },
      { page: 31, text: "English Grades 6 to 8 follow a reading-writing cycle: one comprehension unit and one composition task every two weeks." },
      { page: 48, text: "Every subject reserves the final week of each term for revision and formative assessment." },
    ],
  },
  {
    id: "d4",
    title: "Computer Science Grades 9-10 Syllabus",
    file: "CS-Syllabus-Grades-9-10.pdf",
    category: "Syllabus",
    subject: "Computer Science",
    grade: "Grade 9",
    pages: 28,
    size: 1_100_000,
    uploaded: "2026-07-24",
    status: "indexed",
    progress: 100,
    keywords: ["computer", "cs", "programming", "python", "algorithm", "networks", "data"],
    passages: [
      { page: 4, text: "Grade 9 covers problem solving, algorithms and flowcharts, number systems and an introduction to Python programming." },
      { page: 17, text: "Grade 10 covers data structures (lists, dictionaries), databases with SQL basics, and computer networks." },
    ],
  },
  {
    id: "d5",
    title: "Teacher Pedagogy & Lesson Planning Handbook",
    file: "Pedagogy-Lesson-Planning-Handbook.pdf",
    category: "Handbook",
    pages: 96,
    size: 4_800_000,
    uploaded: "2026-06-11",
    status: "indexed",
    progress: 100,
    keywords: ["lesson plan", "lesson", "pedagogy", "teaching", "objectives", "assessment", "differentiation", "classroom"],
    passages: [
      { page: 11, text: "Every lesson plan must state measurable learning objectives, link to a syllabus unit, and include a starter, main activity and plenary." },
      { page: 23, text: "Differentiation: plan one extension task for advanced learners and one scaffolded task for students who need support." },
      { page: 40, text: "Formative checks (exit tickets, quick quizzes) should be recorded at least once a week per class." },
    ],
  },
  {
    id: "d6",
    title: "Student Code of Conduct Policy",
    file: "Student-Code-of-Conduct.pdf",
    category: "Policy",
    pages: 18,
    size: 900_000,
    uploaded: "2026-04-03",
    status: "indexed",
    progress: 100,
    keywords: ["conduct", "discipline", "uniform", "behaviour", "behavior", "mobile", "phone", "bullying", "policy"],
    passages: [
      { page: 4, text: "Students must wear the prescribed uniform; the winter uniform applies from 1 November to 28 February." },
      { page: 7, text: "Mobile phones are not permitted during school hours and will be held by the class teacher until dismissal." },
      { page: 12, text: "Bullying in any form is a serious offence: the first incident leads to a parent meeting, repeat incidents to suspension review." },
    ],
  },
  {
    id: "d7",
    title: "Assessment & Examination Policy",
    file: "Assessment-Examination-Policy.docx",
    category: "Policy",
    pages: 22,
    size: 640_000,
    uploaded: "2026-04-03",
    status: "indexed",
    progress: 100,
    keywords: ["exam", "examination", "assessment", "grading", "attendance requirement", "promotion", "result", "mid-term", "75%"],
    passages: [
      { page: 5, text: "A minimum of 75% attendance is required to sit the annual examination; the principal may condone up to 5% on medical grounds." },
      { page: 9, text: "Term weighting: mid-term 30%, coursework 20%, final examination 50%." },
      { page: 15, text: "Promotion requires a pass in English, Mathematics and at least three other subjects." },
    ],
  },
];

export const formatBytes = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

/* ---------------- Audit trail ---------------- */

export type AuditKind = "teacher" | "student" | "announcement" | "assessment" | "report" | "vault" | "session";
export type AuditEntry = { id: string; at: string; kind: AuditKind; action: string; detail: string; status: "executed" | "cancelled" };

export const seedAudit: AuditEntry[] = [
  { id: "a1", at: "2026-10-12T15:42", kind: "announcement", action: "Posted announcement", detail: "\"Mid-term exam schedule released\" to Students Only", status: "executed" },
  { id: "a2", at: "2026-10-11T10:05", kind: "teacher", action: "Added teacher", detail: "Hina Aslam (Chemistry), invite sent to hina.aslam@greenfield.edu.pk", status: "executed" },
  { id: "a3", at: "2026-10-09T09:18", kind: "vault", action: "Indexed document", detail: "Annual Syllabus & Pacing Plan 2026-27 (64 pages)", status: "executed" },
  { id: "a4", at: "2026-10-08T13:27", kind: "student", action: "Enroll student", detail: "Draft for Rayan Malik (Grade 4-B) discarded", status: "cancelled" },
];

/* ---------------- Replies ---------------- */

export type Tone = "ok" | "warn" | "serious" | "danger" | "neutral";

export type Block =
  | { kind: "stats"; items: { label: string; value: string; tone?: Tone }[] }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "list"; items: string[] }
  | { kind: "links"; items: { label: string; href: string }[] };

export type DraftAction =
  | { type: "teacher"; name: string; subject: string; email: string; phone: string; classTeacher: string }
  | { type: "student"; name: string; section: string; guardian: string; phone: string }
  | { type: "announcement"; title: string; body: string; audience: "school" | "staff" | "students"; priority: "normal" | "important" | "urgent" }
  // Teacher copilot actions, limited to the teacher's own classes.
  | { type: "quiz"; topic: string; section: string; subject: string; count: number; difficulty: "Easy" | "Medium" | "Hard" | "Adaptive" }
  | { type: "class-notice"; section: string; title: string; body: string; audience: "students" | "parents"; priority: "normal" | "important" | "urgent" }
  | { type: "remark"; studentId: string; student: string; section: string; text: string };

export type Reply = {
  text: string;
  blocks?: Block[];
  sources?: { doc: string; page: number }[];
  /** Data and tools the copilot used, shown as a trace under the answer. */
  tools: string[];
  action?: DraftAction;
};

/* ---------------- Intent engine ---------------- */

export const has = (q: string, re: RegExp) => re.test(q);
export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
export const pct = (n: number, of: number) => (of ? Math.round((n / of) * 1000) / 10 : 0);
export const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** "grade 9", "grade 10-b", "class 7 b" to { grade, section? }. */
export function findClass(q: string) {
  const m = q.match(/(?:grade|class)\s*(\d{1,2})(?:\s*[- ]?\s*([abc])\b)?/i);
  if (!m) return null;
  const grade = Number(m[1]);
  const section = m[2] ? `${grade}-${m[2].toUpperCase()}` : undefined;
  return { grade, section: section && sections.includes(section) ? section : undefined };
}

const inClass = (s: Student, c: { grade: number; section?: string }) => (c.section ? s.section === c.section : parseInt(s.section) === c.grade);
const classText = (c: { grade: number; section?: string }) => (c.section ? sectionLabel(c.section) : `Grade ${c.grade}`);

function findStudent(q: string) {
  return students.find((s) => q.includes(s.name.toLowerCase()));
}
function findTeacher(q: string) {
  return teachers.find((t) => q.includes(t.name.toLowerCase()) || q.includes(t.name.toLowerCase().replace(/^(mr|ms|mrs|dr)\.?\s+/, "")));
}

/** Name in quotes, or the capitalised words after "named"/"called"/"for". */
export function extractName(raw: string) {
  const quoted = raw.match(/["']([^"']{3,60})["']/);
  if (quoted) return title(quoted[1].trim());
  const after = raw.match(/\b(?:named|called|name is|for)\s+([A-Za-z][A-Za-z.]+(?:\s+[A-Za-z][A-Za-z.]+){0,3})/i);
  if (after) return title(after[1].replace(/\s+(as|to|in|with|who|teaching|for)\b.*$/i, "").trim());
  return "";
}

function snapshot(): Reply {
  const present = students.filter((s) => s.today === "present").length;
  const active = teachers.filter((t) => t.status !== "inactive");
  const checked = active.filter((t) => t.checkIn.state === "present" || t.checkIn.state === "late").length;
  const period = periods.find((p) => p.key === CURRENT_PERIOD)!;
  const recs = accounts.map((a) => recordFor(a, period));
  const critical = accounts.filter((a) => unpaidMonths(a) >= DEFAULTER_MONTHS).length;
  return {
    text: `Here is today's institutional snapshot for ${period.label}.`,
    tools: ["students", "teacher check-ins", "fee installments", "talent roster"],
    blocks: [
      {
        kind: "stats",
        items: [
          { label: "Students present", value: `${present} / ${students.length}`, tone: "ok" },
          { label: "Teachers checked in", value: `${checked} / ${active.length}`, tone: "neutral" },
          { label: "Fees cleared this month", value: `${recs.filter((r) => r.status === "paid").length} students`, tone: "ok" },
          { label: "Critical fee defaulters", value: String(critical), tone: "danger" },
          { label: "Profiled talents", value: String(talents.length), tone: "neutral" },
          { label: "Attendance defaulters", value: String(students.filter((s) => s.termRate < DEFAULTER_BELOW).length), tone: "warn" },
        ],
      },
    ],
  };
}

function feeReply(q: string): Reply {
  const s = findStudent(q);
  const period = periods.find((p) => p.key === CURRENT_PERIOD)!;
  if (s) {
    const a = accounts.find((x) => x.student.id === s.id)!;
    const r = recordFor(a, period);
    const b = behaviorFor(a);
    return {
      text: `${s.name} (${sectionLabel(s.section)}) is currently ${r.status === "pending" ? "not yet due" : r.status} for ${period.label}. Since enrolling on ${s.enrolled}, ${b.rate}% of installments were cleared on time (${behaviorOf(b.key).label.toLowerCase()}).`,
      tools: ["fee installments", "payment records"],
      blocks: [
        {
          kind: "stats",
          items: [
            { label: "On time", value: String(b.onTime), tone: "ok" },
            { label: "Paid late", value: b.late ? `${b.late} (avg ${b.avgDelay}d)` : "0", tone: b.late ? "serious" : "neutral" },
            { label: "Paid in parts", value: String(b.partials), tone: b.partials ? "warn" : "neutral" },
            { label: "Unpaid now", value: String(b.unpaid), tone: b.unpaid ? "danger" : "ok" },
          ],
        },
        { kind: "links", items: [{ label: "Open Student Fees", href: "/principal/fees" }] },
      ],
    };
  }
  const c = findClass(q);
  const pool = accounts.filter((a) => !c || inClass(a.student, c));
  const recs = pool.map((a) => recordFor(a, period));
  const count = (k: string) => recs.filter((r) => r.status === k).length;
  const defaulters = recs.filter((r) => r.status === "defaulter").sort((x, y) => y.months - x.months || y.overdueDays - x.overdueDays);
  const bySection = sections
    .map((sec) => ({ sec, n: recs.filter((r) => r.account.student.section === sec && r.overdueDays > 0).length }))
    .filter((x) => x.n)
    .sort((x, y) => y.n - x.n)
    .slice(0, 3);
  return {
    text: `${c ? classText(c) : "Across the school"}, ${count("paid")} of ${recs.length} students have cleared ${period.label}. ${plural(count("delayed") + count("partial") + count("defaulter"), "student")} are past a due date, and ${plural(defaulters.length, "critical defaulter")} have ${DEFAULTER_MONTHS}+ months unpaid.`,
    tools: ["fee installments", "defaulter tracking"],
    blocks: [
      {
        kind: "stats",
        items: [
          { label: "Paid", value: String(count("paid")), tone: "ok" },
          { label: "Partial", value: String(count("partial")), tone: "warn" },
          { label: "Delayed", value: String(count("delayed")), tone: "serious" },
          { label: "Defaulters", value: String(count("defaulter")), tone: "danger" },
        ],
      },
      ...(defaulters.length
        ? [
            {
              kind: "table" as const,
              columns: ["Student", "Class", "Months unpaid", "Overdue by", "Guardian"],
              rows: defaulters.slice(0, 6).map((r) => [r.account.student.name, r.account.student.section, String(r.months), `${r.overdueDays} days`, r.account.student.phone]),
            },
          ]
        : []),
      ...(!c && bySection.length ? [{ kind: "list" as const, items: bySection.map((x) => `${sectionLabel(x.sec)}: ${plural(x.n, "student")} overdue`) }] : []),
      { kind: "links", items: [{ label: "Open Student Fees", href: "/principal/fees" }] },
    ],
  };
}

function talentReply(q: string): Reply {
  const c = findClass(q);
  const skill = [...new Set(talents.flatMap(skillsOf))].find((k) => q.includes(k.toLowerCase()));
  const catWord = [
    ["sport", "Sports & Athletics"],
    ["athlet", "Sports & Athletics"],
    ["debat", "Debate & Public Speaking"],
    ["speak", "Debate & Public Speaking"],
    ["art", "Performing Arts & Music"],
    ["music", "Performing Arts & Music"],
    ["writ", "Creative Writing"],
    ["stem", "STEM & Robotics"],
    ["robot", "STEM & Robotics"],
  ].find(([w]) => q.includes(w))?.[1];
  const champions = /(champion|gold|winner|best|top)/.test(q);
  const list = talents
    .filter((t) => !c || inClass(t.student, c))
    .filter((t) => !skill || skillsOf(t).includes(skill))
    .filter((t) => skill || !catWord || categoriesOf(t).includes(catWord))
    .filter((t) => !champions || levelRank(t.level) >= 3)
    .sort((x, y) => levelRank(y.level) - levelRank(x.level));
  const scope = [skill ?? catWord, c && classText(c), champions && "award winners"].filter(Boolean).join(", ");
  return {
    text: list.length ? `I found ${plural(list.length, "student")} in the talent directory${scope ? ` (${scope})` : ""}. Strongest profiles first:` : `No profiled talents match ${scope || "that request"}.`,
    tools: ["talent roster"],
    blocks: list.length
      ? [
          { kind: "table", columns: ["Student", "Class", "Primary talent", "Level", "Key achievement"], rows: list.slice(0, 8).map((t) => [t.student.name, t.student.section, `${t.primary.skill}${t.primary.role ? ` - ${t.primary.role}` : ""}`, levelOf(t.level).short, t.achievement]) },
          { kind: "links", items: [{ label: "Open Talents", href: "/principal/talents" }] },
        ]
      : undefined,
  };
}

function teacherReply(q: string): Reply {
  const t = findTeacher(q);
  if (t) return teacherProfile(t);
  const active = teachers.filter((x) => x.status !== "inactive");
  const by = (s: string) => active.filter((x) => x.checkIn.state === s);
  const subject = subjects.find((s) => q.includes(s.toLowerCase()));
  if (subject && !/(late|absent|attendance|present)/.test(q)) {
    const list = active.filter((x) => x.subjects.includes(subject));
    return {
      text: `${plural(list.length, "teacher")} teach ${subject}.`,
      tools: ["faculty directory"],
      blocks: [{ kind: "table", columns: ["Teacher", "Classes", "Class teacher", "Today"], rows: list.map((x) => [x.name, x.classes.join(", ") || "-", x.classTeacher ?? "-", x.checkIn.state]) }],
    };
  }
  const late = by("late");
  const absent = by("absent");
  return {
    text: `${by("present").length + late.length} of ${active.length} teachers have checked in today. ${plural(late.length, "teacher")} arrived late and ${absent.length} ${absent.length === 1 ? "is" : "are"} absent.`,
    tools: ["teacher check-ins"],
    blocks: [
      {
        kind: "stats",
        items: [
          { label: "On time", value: String(by("present").length), tone: "ok" },
          { label: "Late", value: String(late.length), tone: "warn" },
          { label: "Absent", value: String(absent.length), tone: "danger" },
        ],
      },
      ...(late.length + absent.length
        ? [{ kind: "table" as const, columns: ["Teacher", "Status", "Check-in", "Class teacher of"], rows: [...late, ...absent].map((x) => [x.name, x.checkIn.state, x.checkIn.time ?? "-", x.classTeacher ?? "-"]) }]
        : []),
      { kind: "links", items: [{ label: "Open Teachers", href: "/principal/teachers" }] },
    ],
  };
}

function teacherProfile(t: Teacher): Reply {
  return {
    text: `${t.name} (${t.empId}) teaches ${t.subjects.join(", ")}${t.classTeacher ? ` and is class teacher of ${sectionLabel(t.classTeacher)}` : ""}. Status today: ${t.checkIn.state}${t.checkIn.time ? ` at ${t.checkIn.time}` : ""}.`,
    tools: ["faculty directory", "teacher check-ins"],
    blocks: [
      { kind: "list", items: [`Email: ${t.email}`, `Phone: ${t.phone}`, `Classes: ${t.classes.join(", ") || "None"}`, `Joined: ${t.joined}`] },
      { kind: "links", items: [{ label: "Open Teachers", href: "/principal/teachers" }] },
    ],
  };
}

function studentReply(q: string): Reply {
  const s = findStudent(q);
  if (s) {
    const talent = talents.find((t) => t.student.id === s.id);
    const a = accounts.find((x) => x.student.id === s.id)!;
    const b = behaviorFor(a);
    return {
      text: `${s.name} is in ${sectionLabel(s.section)} (roll ${s.rollNo}), class teacher ${classTeacherOf(s.section)}. Today: ${s.today}. Term attendance is ${s.termRate}%${s.termRate < DEFAULTER_BELOW ? ", below the 75% exam requirement" : ""}.`,
      tools: ["student profiles", "attendance", "fee behavior", "talent roster"],
      blocks: [
        {
          kind: "stats",
          items: [
            { label: "Term attendance", value: `${s.termRate}%`, tone: s.termRate < DEFAULTER_BELOW ? "danger" : "ok" },
            { label: "Fee behavior", value: behaviorOf(b.key).label, tone: b.key === "defaulter" ? "danger" : b.key === "punctual" ? "ok" : "neutral" },
            { label: "Talent", value: talent ? talent.primary.skill : "Not profiled", tone: "neutral" },
          ],
        },
        { kind: "list", items: [`Guardian: ${s.guardian} (${s.guardianRelation}), ${s.phone}`, `Registration: ${s.regId}, enrolled ${s.enrolled}`] },
        { kind: "links", items: [{ label: "Open Students", href: "/principal/students" }] },
      ],
    };
  }
  const c = findClass(q);
  const pool = c ? students.filter((x) => inClass(x, c)) : students;
  const present = pool.filter((x) => x.today === "present").length;
  const low = pool.filter((x) => x.termRate < DEFAULTER_BELOW).sort((x, y) => x.termRate - y.termRate);
  const avg = Math.round((pool.reduce((n, x) => n + x.termRate, 0) / pool.length) * 10) / 10;
  return {
    text: `${c ? classText(c) : "School-wide"}: ${present} of ${pool.length} students are present today (${pct(present, pool.length)}%). Term average attendance is ${avg}%, and ${plural(low.length, "student")} ${low.length === 1 ? "is" : "are"} below ${DEFAULTER_BELOW}%.`,
    tools: ["attendance", "student profiles"],
    blocks: [
      {
        kind: "stats",
        items: [
          { label: "Present", value: String(present), tone: "ok" },
          { label: "Absent", value: String(pool.filter((x) => x.today === "absent").length), tone: "danger" },
          { label: "On leave", value: String(pool.filter((x) => x.today === "leave").length), tone: "warn" },
          { label: "Term average", value: `${avg}%`, tone: "neutral" },
        ],
      },
      ...(low.length ? [{ kind: "table" as const, columns: ["Student", "Class", "Term attendance", "Guardian phone"], rows: low.slice(0, 8).map((x) => [x.name, x.section, `${x.termRate}%`, x.phone]) }] : []),
      { kind: "links", items: [{ label: "Open Students", href: "/principal/students" }] },
    ],
  };
}

export function vaultReply(q: string, vault: VaultDoc[]): Reply {
  const ready = vault.filter((d) => d.status === "indexed");
  const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const scored = ready
    .flatMap((d) =>
      d.passages.map((p) => {
        const hay = `${d.title} ${d.subject ?? ""} ${d.grade ?? ""} ${d.keywords.join(" ")} ${p.text}`.toLowerCase();
        const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0) + d.keywords.filter((k) => q.includes(k)).length * 2;
        return { d, p, score };
      }),
    )
    .filter((x) => x.score > 1)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
  if (!ready.length) return { text: "Your knowledge vault has no indexed documents yet. Upload a textbook, syllabus or policy in Manage Document Vault and I will use it to answer.", tools: ["knowledge vault"] };
  if (!scored.length)
    return {
      text: `I searched ${plural(ready.length, "indexed document")} but found nothing specific for that. Try naming a subject, grade, unit or policy, or upload the relevant book to the vault.`,
      tools: ["knowledge vault"],
    };
  const lesson = /(lesson plan|audit|align)/.test(q);
  return {
    text: lesson
      ? "Here is what the vault says a compliant lesson plan needs. I checked it against the syllabus pacing so you can audit plans quickly:"
      : `From your knowledge vault, ${scored[0].d.title} is the closest match:`,
    tools: ["knowledge vault", "semantic search"],
    blocks: [
      { kind: "list", items: scored.map((x) => x.p.text) },
      ...(lesson
        ? [
            {
              kind: "list" as const,
              items: ["Checklist: measurable objectives stated", "Linked to a syllabus unit in the current pacing week", "Starter, main activity and plenary present", "One extension and one support task", "A formative check recorded this week"],
            },
          ]
        : []),
    ],
    sources: scored.map((x) => ({ doc: x.d.title, page: x.p.page })),
  };
}

function noticeReply(): Reply {
  const pub = notices.filter((n) => n.status === "published");
  const sched = notices.filter((n) => n.status === "scheduled");
  return {
    text: `${plural(pub.length, "announcement")} ${pub.length === 1 ? "is" : "are"} live and ${sched.length} scheduled. The latest is "${pub[0]?.title ?? "none"}".`,
    tools: ["announcements"],
    blocks: [
      { kind: "table", columns: ["Title", "Status", "Priority", "Read"], rows: notices.slice(0, 6).map((n) => [n.title, n.status, n.priority, `${n.reads.read}/${n.reads.total}`]) },
      { kind: "links", items: [{ label: "Open Announcements", href: "/principal/announcements" }] },
    ],
  };
}

/** Admin actions: the copilot drafts, the principal confirms before anything runs. */
function actionReply(raw: string, q: string): Reply | null {
  if (has(q, /(announce|announcement|notice|circular|broadcast)/) && has(q, /(draft|post|send|create|write|publish|make|prepare)/)) {
    const about = raw.match(/\babout\s+(.+?)(?:\s+(?:to|for)\s+(?:all|the|staff|teachers|students|parents)\b.*)?$/i)?.[1]?.trim();
    const audience = has(q, /(teacher|staff|faculty)/) ? "staff" : has(q, /(student|parent)/) ? "students" : "school";
    const urgent = has(q, /(urgent|emergency|immediately|closure|closed)/);
    const topic = about ? about.replace(/[.?!]+$/, "") : "School update";
    return {
      text: "I drafted this announcement. Review and edit it, then confirm to post it.",
      tools: ["announcements", "draft writer"],
      action: {
        type: "announcement",
        title: title(topic).slice(0, 80),
        body: `Dear ${audience === "staff" ? "colleagues" : audience === "students" ? "students and parents" : "school community"}, please note: ${topic}. Further details will be shared by the class teachers. Thank you for your cooperation.`,
        audience,
        priority: urgent ? "urgent" : "normal",
      },
    };
  }
  if (has(q, /(add|register|onboard|hire|create|new)/) && has(q, /(teacher|faculty|staff member)/) && !has(q, /(how many|list|show|who)/)) {
    const name = extractName(raw);
    const subject = subjects.find((s) => q.includes(s.toLowerCase())) ?? "";
    const c = findClass(q);
    return {
      text: name ? `Ready to add ${name} as a teacher. Check the details and confirm.` : "Sure. Fill in the teacher's details below and confirm to create the account.",
      tools: ["faculty directory", "account provisioning"],
      action: { type: "teacher", name, subject, email: name ? emailFor(name) : "", phone: "", classTeacher: c?.section ?? "" },
    };
  }
  if (has(q, /(enrol|enroll|admit|admission|register|add|new)/) && has(q, /(student|pupil|child|admission)/) && !has(q, /(how many|list|show|who)/)) {
    const name = extractName(raw);
    const c = findClass(q);
    const guardian = raw.match(/\b(?:father|mother|guardian|parent)\s+(?:is\s+|named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/)?.[1] ?? "";
    return {
      text: name ? `Ready to enroll ${name}. Confirm the class and guardian details.` : "Sure. Fill in the new student's details below and confirm to enroll them.",
      tools: ["student profiles", "admissions"],
      action: { type: "student", name, section: c?.section ?? (c ? `${c.grade}-A` : ""), guardian, phone: "" },
    };
  }
  return null;
}

export const suggestions: { group: string; prompts: string[] }[] = [
  { group: "Query school data", prompts: ["Give me today's school snapshot", "Which teachers are late or absent today?", "Who are the critical fee defaulters?", "Show attendance for Grade 10-A"] },
  { group: "Take action", prompts: ["Add a new teacher named Sana Tariq for Physics", "Enroll a student named Ali Hamza in Grade 6-B", "Draft an urgent announcement about winter uniform to all students"] },
  { group: "Curriculum & policy", prompts: ["What should Grade 9 Maths cover by October?", "Audit a lesson plan against our handbook", "What is the attendance requirement for exams?"] },
];

/** Answers a principal's request from the platform's records and the knowledge vault. */
export function respond(raw: string, vault: VaultDoc[]): Reply {
  const q = raw.toLowerCase().trim();
  const action = actionReply(raw, q);
  if (action) return action;
  if (has(q, /(syllabus|curriculum|textbook|book|chapter|lesson|policy|handbook|pedagog|\bunit\b|aligned|alignment|uniform|exam|conduct|cover)/)) return vaultReply(q, vault);
  if (has(q, /(fee|defaulter|paid|unpaid|installment|overdue|dues)/)) return feeReply(q);
  if (has(q, /(talent|athlete|cricket|football|debate|sport|robot|champion|co-curricular|music|drama|painting|chess|athletics)/)) return talentReply(q);
  if (has(q, /(announcement|notice|circular)/)) return noticeReply();
  if (findTeacher(q) || has(q, /(teacher|faculty|staff)/)) return teacherReply(q);
  if (findStudent(q) || has(q, /(student|attendance|absent|present|class|grade)/)) return studentReply(q);
  if (has(q, /(snapshot|overview|summary|today|how is|status|dashboard|everything)/)) return snapshot();
  return {
    text: "I can query any school record, take admin actions after your confirmation, and answer from your uploaded books and policies. Try one of these:",
    tools: [],
    blocks: [{ kind: "list", items: suggestions.flatMap((s) => s.prompts.slice(0, 2)) }],
  };
}

