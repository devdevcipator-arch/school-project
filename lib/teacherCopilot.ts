// Teacher AI Copilot: same interface as the principal's, but every answer and action is limited to the
// teacher's own classes (RBAC). Fees, other teachers' records and admin actions stay with the principal.
// Replace `respondTeacher` with the LLM + tool-calling API in the backend phase.

import { sectionSubjects, seedAssessments, seedSubmissions } from "./assessments";
import { mySections, rosterOf } from "./classAttendance";
import { has, findClass, plural, pct, title, vaultReply, type Reply, type VaultDoc } from "./copilot";
import { myHistory } from "./myAttendance";
import { seedReports, suggestFeedback, totals } from "./reports";
import { DEFAULTER_BELOW, sectionLabel, students, type Student } from "./students";
import { categoriesOf, levelOf, levelRank, skillsOf, talents } from "./talents";
import { teacher, teacherToday } from "./teacher";
import { summarize } from "./teacherAttendance";
import { subjects } from "./teachers";

const mine = mySections.map((s) => s.section);
const myStudents = students.filter((s) => mine.includes(s.section));
const classList = mine.map(sectionLabel).join(", ");
const firstOf = (section: string) => rosterOf(section)[0];

/** A class the teacher named, if it is one of theirs; `foreign` when they named someone else's. */
function myClass(q: string): { sections: string[]; label: string; foreign?: string } {
  const c = findClass(q);
  if (!c) return { sections: mine, label: "your classes" };
  const hit = c.section ? mine.filter((s) => s === c.section) : mine.filter((s) => parseInt(s) === c.grade);
  if (!hit.length) return { sections: [], label: "", foreign: c.section ? sectionLabel(c.section) : `Grade ${c.grade}` };
  return { sections: hit, label: hit.map(sectionLabel).join(", ") };
}

const outside = (what: string): Reply => ({
  text: `${what} is outside your classes. As a class teacher you can see ${classList}. Ask the principal's office for other classes.`,
  tools: ["access control"],
});

function findAnyStudent(q: string): Student | undefined {
  return students.find((s) => q.includes(s.name.toLowerCase()));
}

/** First-term report numbers for one student. */
function reportOf(s: Student) {
  const roster = rosterOf(s.section);
  const reports = seedReports(roster, s.section, "first-2026");
  const r = reports[roster.findIndex((x) => x.id === s.id)];
  return { r, t: totals(r) };
}

function snapshot(): Reply {
  const rows = mine.map((sec) => {
    const pool = myStudents.filter((s) => s.section === sec);
    const by = (k: string) => pool.filter((s) => s.today === k).length;
    return { sec, total: pool.length, present: by("present"), absent: by("absent"), leave: by("leave") };
  });
  const total = rows.reduce((n, r) => n + r.total, 0);
  const present = rows.reduce((n, r) => n + r.present, 0);
  const now = new Date();
  const live = seedAssessments(now).filter((a) => mine.includes(a.section) && a.status === "live");
  const toMark = live.filter((a) => !a.autoGraded).reduce((n, a) => n + seedSubmissions(a, rosterOf(a.section)).filter((s) => s.state !== "none" && s.score === null).length, 0);
  return {
    text: `Good day, ${teacher.firstName}. Here is today across ${classList}. You checked in at ${teacherToday.checkIn} and have ${teacherToday.classesRemaining} of ${teacherToday.classesTotal} classes left.`,
    tools: ["class attendance", "assessments", "my attendance"],
    blocks: [
      {
        kind: "stats",
        items: [
          { label: "Students present", value: `${present} / ${total}`, tone: "ok" },
          { label: "Absent or on leave", value: String(total - present), tone: total - present ? "warn" : "ok" },
          { label: "Live assessments", value: String(live.length), tone: "neutral" },
          { label: "Submissions to mark", value: String(toMark), tone: toMark ? "warn" : "ok" },
        ],
      },
      { kind: "table", columns: ["Class", "Present", "Absent", "Leave", "Rate"], rows: rows.map((r) => [sectionLabel(r.sec), String(r.present), String(r.absent), String(r.leave), `${pct(r.present, r.total)}%`]) },
      { kind: "links", items: [{ label: "Open Class Attendance", href: "/teacher/class-attendance" }] },
    ],
  };
}

function absentReply(q: string): Reply {
  const c = myClass(q);
  if (c.foreign) return outside(c.foreign);
  const list = myStudents.filter((s) => c.sections.includes(s.section) && s.today !== "present").sort((a, b) => a.section.localeCompare(b.section) || a.rollNo - b.rollNo);
  return {
    text: list.length ? `${plural(list.length, "student")} in ${c.label} ${list.length === 1 ? "is" : "are"} not in class today.` : `Everyone in ${c.label} is present today.`,
    tools: ["class attendance"],
    blocks: list.length
      ? [
          { kind: "table", columns: ["Student", "Class", "Roll", "Today", "Term attendance"], rows: list.map((s) => [s.name, s.section, String(s.rollNo), s.today === "leave" ? "On leave" : "Absent", `${s.termRate}%`]) },
          { kind: "links", items: [{ label: "Open Class Attendance", href: "/teacher/class-attendance" }] },
        ]
      : undefined,
  };
}

function lowAttendance(q: string): Reply {
  const c = myClass(q);
  if (c.foreign) return outside(c.foreign);
  const list = myStudents.filter((s) => c.sections.includes(s.section) && s.termRate < DEFAULTER_BELOW).sort((a, b) => a.termRate - b.termRate);
  return {
    text: list.length
      ? `${plural(list.length, "student")} in ${c.label} ${list.length === 1 ? "is" : "are"} below the ${DEFAULTER_BELOW}% exam attendance requirement. Their guardians should be contacted this week.`
      : `No student in ${c.label} is below ${DEFAULTER_BELOW}% this term.`,
    tools: ["class attendance", "attendance policy"],
    blocks: list.length ? [{ kind: "table", columns: ["Student", "Class", "Term attendance", "Guardian", "Phone"], rows: list.map((s) => [s.name, s.section, `${s.termRate}%`, s.guardian, s.phone]) }] : undefined,
  };
}

function studentReply(s: Student): Reply {
  if (!mine.includes(s.section)) return outside(`${s.name} (${sectionLabel(s.section)})`);
  const { t } = reportOf(s);
  const talent = talents.find((x) => x.student.id === s.id);
  return {
    text: `${s.name} is roll ${s.rollNo} in ${sectionLabel(s.section)}. Today: ${s.today}. Term attendance ${s.termRate}%${s.termRate < DEFAULTER_BELOW ? ", below the exam requirement" : ""}. First-term result ${t.pct}% (grade ${t.grade}).`,
    tools: ["class roster", "attendance", "report cards", "talent roster"],
    blocks: [
      {
        kind: "stats",
        items: [
          { label: "Term attendance", value: `${s.termRate}%`, tone: s.termRate < DEFAULTER_BELOW ? "danger" : "ok" },
          { label: "First term", value: `${t.pct}% · ${t.grade}`, tone: t.pct < 60 ? "warn" : "ok" },
          { label: "Talent", value: talent ? talent.primary.skill : "Not profiled", tone: "neutral" },
        ],
      },
      { kind: "list", items: [`Guardian: ${s.guardian} (${s.guardianRelation}), ${s.phone}`, `System ID: ${s.regId}`] },
      { kind: "links", items: [{ label: "Open Result Card", href: "/teacher/reports" }] },
    ],
  };
}

function performance(q: string): Reply {
  const c = myClass(q);
  if (c.foreign) return outside(c.foreign);
  const rows = c.sections.flatMap((sec) => {
    const roster = rosterOf(sec);
    return seedReports(roster, sec, "first-2026").map((r, i) => ({ s: roster[i], t: totals(r) }));
  });
  const weak = /(weak|struggl|low|fail|attention|below|support)/.test(q);
  const list = [...rows].sort((a, b) => (weak ? a.t.pct - b.t.pct : b.t.pct - a.t.pct)).slice(0, 6);
  const avg = Math.round((rows.reduce((n, x) => n + x.t.pct, 0) / rows.length) * 10) / 10;
  return {
    text: weak
      ? `These students in ${c.label} need the most support, based on first-term marks. Class average is ${avg}%.`
      : `Top performers in ${c.label} this first term. Class average is ${avg}%.`,
    tools: ["report cards", "assessment marks"],
    blocks: [
      { kind: "table", columns: ["Student", "Class", "Overall", "Grade", "Attendance"], rows: list.map((x) => [x.s.name, x.s.section, `${x.t.pct}%`, x.t.grade, `${x.s.termRate}%`]) },
      { kind: "links", items: [{ label: "Open Result Card", href: "/teacher/reports" }] },
    ],
  };
}

function talentReply(q: string): Reply {
  const c = myClass(q);
  if (c.foreign) return outside(c.foreign);
  const sport = /(sport|athlet|cricket|football)/.test(q);
  const list = talents
    .filter((t) => c.sections.includes(t.student.section))
    .filter((t) => !sport || categoriesOf(t).includes("Sports & Athletics"))
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));
  return {
    text: list.length ? `${plural(list.length, "talented student")} in ${c.label}, strongest profiles first:` : `No profiled talents in ${c.label} yet.`,
    tools: ["talent roster"],
    blocks: list.length
      ? [
          { kind: "table", columns: ["Student", "Class", "Primary talent", "Level"], rows: list.slice(0, 8).map((t) => [t.student.name, t.student.section, t.primary.skill, levelOf(t.level).short]) },
          { kind: "list", items: [`Also skilled in: ${[...new Set(list.flatMap(skillsOf))].slice(0, 6).join(", ")}`] },
          { kind: "links", items: [{ label: "Open Talents", href: "/teacher/talents" }] },
        ]
      : undefined,
  };
}

function assessmentsReply(): Reply {
  const now = new Date();
  const list = seedAssessments(now).filter((a) => mine.includes(a.section) && (a.status === "live" || a.status === "scheduled"));
  return {
    text: `You have ${plural(list.filter((a) => a.status === "live").length, "live assessment")} and ${list.filter((a) => a.status === "scheduled").length} scheduled across ${classList}.`,
    tools: ["assessments", "submissions"],
    blocks: [
      {
        kind: "table",
        columns: ["Assessment", "Class", "Status", "Submitted", "To mark"],
        rows: list.map((a) => {
          const subs = seedSubmissions(a, rosterOf(a.section));
          const sub = subs.filter((s) => s.state !== "none");
          return [a.title, a.section, a.status, `${sub.length}/${subs.length}`, a.autoGraded ? "Auto-graded" : String(sub.filter((s) => s.score === null).length)];
        }),
      },
      { kind: "links", items: [{ label: "Open Assessments", href: "/teacher/assessments" }] },
    ],
  };
}

function myAttendanceReply(): Reply {
  const now = new Date();
  const records = myHistory(now);
  const key = now.toISOString().slice(0, 7);
  const m = summarize(records.filter((r) => r.date.startsWith(key)));
  return {
    text: `This month you attended ${m.present + m.late} of ${m.total} working days (${m.rate}%), with ${plural(m.late, "late arrival")}. Today you checked in at ${teacherToday.checkIn}.`,
    tools: ["my attendance"],
    blocks: [
      {
        kind: "stats",
        items: [
          { label: "On time", value: String(m.present), tone: "ok" },
          { label: "Late", value: String(m.late), tone: m.late ? "warn" : "ok" },
          { label: "Absent", value: String(m.absent), tone: m.absent ? "danger" : "ok" },
        ],
      },
      { kind: "links", items: [{ label: "Open My Attendance", href: "/teacher/my-attendance" }] },
    ],
  };
}

/** Draft actions the teacher confirms before anything runs. */
function actionReply(raw: string, q: string): Reply | null {
  if (has(q, /(quiz|test|mcq|paper|assessment)/) && has(q, /(generate|create|make|prepare|draft|set|build|write)/)) {
    const c = myClass(q);
    if (c.foreign) return outside(c.foreign);
    const section = c.sections[0];
    const subject = subjects.find((s) => q.includes(s.toLowerCase())) ?? (q.includes("maths") || q.includes("math") ? "Mathematics" : sectionSubjects(section)[0]);
    const topic = raw.match(/\b(?:on|about|covering|for the topic)\s+(.+?)(?:\s+(?:for|in|to)\s+(?:grade|class)\b.*)?$/i)?.[1]?.replace(/[.?!]+$/, "").trim() ?? "";
    const count = Number(q.match(/(\d{1,2})\s*(?:question|mcq|item)/)?.[1] ?? 10);
    const difficulty = q.includes("hard") ? "Hard" : q.includes("easy") ? "Easy" : q.includes("adaptive") ? "Adaptive" : "Medium";
    return {
      text: topic ? `I will write a ${count}-question ${difficulty.toLowerCase()} quiz on ${title(topic)} for ${sectionLabel(section)}. Check the brief and confirm.` : "Sure. Tell me the topic and class below, then confirm and I will write the quiz.",
      tools: ["assessments", "AI test maker"],
      action: { type: "quiz", topic: topic ? title(topic) : "", section, subject: sectionSubjects(section).includes(subject) ? subject : sectionSubjects(section)[0], count: Math.min(30, Math.max(3, count)), difficulty },
    };
  }
  if (has(q, /(notice|announce|message|notify|inform|remind|letter)/) && has(q, /(draft|send|post|write|create|prepare|class|parent)/)) {
    const c = myClass(q);
    if (c.foreign) return outside(c.foreign);
    const about = raw.match(/\babout\s+(.+?)$/i)?.[1]?.replace(/[.?!]+$/, "").trim() ?? "Class update";
    const parents = has(q, /(parent|guardian|home)/);
    return {
      text: `I drafted a notice for ${parents ? "parents of " : ""}${sectionLabel(c.sections[0])}. Edit it if needed, then confirm to send.`,
      tools: ["class roster", "draft writer"],
      action: {
        type: "class-notice",
        section: c.sections[0],
        title: title(about).slice(0, 80),
        body: `Dear ${parents ? "parents and guardians" : "students"}, please note: ${about}. Kindly reach out to me through the school portal if you have any questions. Regards, ${teacher.name}, Class Teacher.`,
        audience: parents ? "parents" : "students",
        priority: has(q, /(urgent|immediately|important)/) ? "important" : "normal",
      },
    };
  }
  if (has(q, /(remark|feedback|comment)/) && has(q, /(write|draft|suggest|give|create|report)/)) {
    const s = findAnyStudent(q);
    if (!s) return { text: "Which student is the remark for? Use their full name, for example: Write a report remark for " + firstOf(mine[0]).name + ".", tools: ["class roster"] };
    if (!mine.includes(s.section)) return outside(`${s.name} (${sectionLabel(s.section)})`);
    const { r } = reportOf(s);
    return {
      text: `Here is a constructive report-card remark for ${s.name}, based on first-term marks and ${s.termRate}% attendance. Edit it, then confirm.`,
      tools: ["report cards", "attendance", "feedback writer"],
      action: { type: "remark", studentId: s.id, student: s.name, section: s.section, text: suggestFeedback(s, r) },
    };
  }
  return null;
}

export const teacherSuggestions: { group: string; prompts: string[] }[] = [
  { group: "Query my classes", prompts: ["Give me today's class snapshot", "Who is absent in my classes today?", "Which students are below 75% attendance?", "Who needs extra support in Grade 10-A?"] },
  {
    group: "Take action",
    prompts: ["Generate a 10 question quiz on Quadratic Equations for Grade 10-A", "Draft a notice to Grade 9-B parents about the science fair", `Write a report remark for ${firstOf(mine[0]).name}`],
  },
  { group: "Curriculum & policy", prompts: ["What should Grade 9 Maths cover by October?", "Audit a lesson plan against our handbook", "What is the attendance requirement for exams?"] },
];

/** Answers a teacher's request from their own classes' records and the knowledge vault. */
export function respondTeacher(raw: string, vault: VaultDoc[]): Reply {
  const q = raw.toLowerCase().trim();
  const action = actionReply(raw, q);
  if (action) return action;
  if (has(q, /(syllabus|curriculum|textbook|book|chapter|lesson|policy|handbook|pedagog|\bunit\b|aligned|alignment|uniform|exam|conduct|cover)/)) return vaultReply(q, vault);
  if (has(q, /(fee|defaulter|paid|unpaid|installment|dues|salary)/)) return { text: "Fee and finance records are managed by the principal's office. Teachers do not have access to them.", tools: ["access control"] };
  if (has(q, /(add|hire|enrol|enroll|admit)\b/) && has(q, /(teacher|student|staff)/)) return { text: "Adding teachers or enrolling students is an administrative action reserved for the principal. I can help with your classes, assessments, reports and the knowledge vault.", tools: ["access control"] };
  const s = findAnyStudent(q);
  if (s) return studentReply(s);
  if (has(q, /(my attendance|my check|i late|was i)/)) return myAttendanceReply();
  // \bsports? so "support" does not count as a sports question.
  if (has(q, /(talent|athlete|cricket|football|debate|\bsports?\b|robot|music|chess|co-curricular)/)) return talentReply(q);
  if (has(q, /(top|best|weak|struggl|support|perform|marks|result|score|fail)/)) return performance(q);
  if (has(q, /(below|defaulter|low attendance|75)/)) return lowAttendance(q);
  if (has(q, /(absent|leave|missing|not in class|who is out)/)) return absentReply(q);
  if (has(q, /(assessment|quiz|test|homework|assignment|submission|mark|grading|due)/)) return assessmentsReply();
  if (has(q, /(snapshot|overview|summary|today|my day|my classes|status|dashboard)/)) return snapshot();
  if (has(q, /(teacher|staff|principal)/)) return outside("Other staff records");
  return {
    text: "I can answer questions about your classes, draft quizzes, notices and report remarks for your confirmation, and answer from the knowledge vault. Try one of these:",
    tools: [],
    blocks: [{ kind: "list", items: teacherSuggestions.flatMap((g) => g.prompts.slice(0, 2)) }],
  };
}
