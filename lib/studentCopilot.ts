// Student AI Study Copilot: same interface as the principal's, limited to the student's courses and studies.
// It explains topics, writes practice questions, plans revision around set work and searches the vault.
// It never answers questions about personal data (contact details, family, fees, records, other people).
// Replace `respondStudent` with the LLM + tool-calling API in the backend phase.

import { generateQuestions } from "./assessments";
import { has, plural, title, vaultReply, type Reply, type VaultDoc } from "./copilot";
import { schoolToday, shortDate, student, studentAssessments, todaySchedule, utcMs } from "./student";
import { students } from "./students";
import { teachers } from "./teachers";

const mySubjects = [...new Set(todaySchedule.filter((p) => !p.isBreak).map((p) => p.subject))];
const subjectOf = (q: string) =>
  mySubjects.find((s) => q.includes(s.toLowerCase())) ?? (/\bmaths?\b/.test(q) ? "Mathematics" : /\bcs\b|computer|python|coding/.test(q) ? "Computer Science" : undefined);

/* ---------------- Privacy guard ---------------- */

// Phrased narrowly so study words ("the result of 2x + 3", "My Hometown essay") still get answers.
const personalTerms =
  /(phone|mobile|whatsapp|contact (number|details|info)|address|where (does|do) .* live|e-?mail|password|login|cnic|id card|date of birth|\bdob\b|birthday|how old|guardian|father|mother|\bparents?\b|family|sibling|brother|sister|\bfees?\b|dues|salary|attendance|absent|my marks|marks of|my results?|results? of [a-z]+ [a-z]+|report card|my rank|class rank|my grades|religion|medical|health record)/;

const otherPerson = (q: string) => {
  const me = student.name.toLowerCase();
  const pupil = students.find((s) => s.name.toLowerCase() !== me && q.includes(s.name.toLowerCase()));
  const staff = teachers.find((t) => q.includes(t.name.toLowerCase().replace(/^(mr|ms|mrs|dr)\.?\s+/, "")));
  return pupil?.name ?? staff?.name;
};

const privacyReply = (who?: string): Reply => ({
  text: `${who ? `I can't share information about ${who}. ` : ""}I'm your study assistant, so I don't answer questions about personal data such as contact details, family, fees, attendance, marks or anyone's private records. Ask me about a topic, a chapter, practice questions or your study plan instead.`,
  tools: ["privacy guard"],
  blocks: [
    { kind: "list", items: ["Explain Newton's laws of motion", "Quiz me on chemical bonding", "Make a study plan for this week"] },
    { kind: "links", items: [{ label: "Open My Attendance", href: "/student/attendance" }, { label: "Open Reports", href: "/student/reports" }] },
  ],
});

/* ---------------- Concept notes ---------------- */

type Concept = { subject: string; keys: RegExp; name: string; summary: string; points: string[]; example: string };

const concepts: Concept[] = [
  {
    subject: "Mathematics",
    keys: /quadratic/,
    name: "Quadratic Equations",
    summary: "A quadratic equation has the form ax² + bx + c = 0 with a ≠ 0. It has at most two roots, where the parabola y = ax² + bx + c crosses the x-axis.",
    points: ["Solve by factorisation, completing the square or the quadratic formula x = (-b ± √(b² - 4ac)) / 2a", "The discriminant b² - 4ac tells you the roots: positive gives two real roots, zero gives one, negative gives none", "Sum of roots = -b/a and product of roots = c/a"],
    example: "x² - 5x + 6 = 0 factorises to (x - 2)(x - 3) = 0, so x = 2 or x = 3.",
  },
  {
    subject: "Mathematics",
    keys: /(linear (equation|inequalit)|inequalit)/,
    name: "Linear Equations and Inequalities",
    summary: "A linear equation has variables to the first power only. An inequality uses <, >, ≤ or ≥ and has a range of solutions instead of one value.",
    points: ["Do the same operation to both sides to isolate the variable", "Multiplying or dividing an inequality by a negative number flips the sign", "Show inequality solutions on a number line: open circle for < or >, filled for ≤ or ≥"],
    example: "-2x + 3 > 7 gives -2x > 4, so x < -2 (the sign flips when dividing by -2).",
  },
  {
    subject: "Mathematics",
    keys: /trigonometr|sine|cosine|tangent|\bsin\b|\bcos\b|\btan\b/,
    name: "Trigonometric Ratios",
    summary: "In a right-angled triangle, the trigonometric ratios link an angle to the ratio of two sides.",
    points: ["sin θ = opposite / hypotenuse", "cos θ = adjacent / hypotenuse", "tan θ = opposite / adjacent, and tan θ = sin θ / cos θ", "Remember SOH CAH TOA"],
    example: "If the opposite side is 3 and the hypotenuse is 5, sin θ = 3/5 = 0.6.",
  },
  {
    subject: "Physics",
    keys: /newton|law(s)? of motion|inertia/,
    name: "Newton's Laws of Motion",
    summary: "Newton's three laws describe how forces change the motion of objects.",
    points: ["First law: an object stays at rest or moves at constant velocity unless a net force acts on it (inertia)", "Second law: F = ma, so a larger net force or smaller mass gives a larger acceleration", "Third law: every action has an equal and opposite reaction on a different body"],
    example: "A 2 kg trolley pushed with a net force of 10 N accelerates at a = F / m = 5 m/s².",
  },
  {
    subject: "Physics",
    keys: /(work|energy|power)\b/,
    name: "Work, Energy and Power",
    summary: "Work is done when a force moves an object. Energy is the capacity to do work, and power is the rate of doing work.",
    points: ["Work W = F × d (joules), when force and movement are in the same direction", "Kinetic energy = ½mv², gravitational potential energy = mgh", "Power P = W / t (watts)"],
    example: "Lifting a 5 kg bag up 2 m does W = mgh = 5 × 10 × 2 = 100 J of work.",
  },
  {
    subject: "Physics",
    keys: /(motion|velocity|speed|acceleration|forces?\b)/,
    name: "Motion and Forces",
    summary: "Motion is described by distance, displacement, speed, velocity and acceleration. Forces cause changes in motion.",
    points: ["Speed = distance / time; velocity also has a direction", "Acceleration a = (v - u) / t", "Equations of motion: v = u + at, s = ut + ½at², v² = u² + 2as"],
    example: "A car going from 0 to 20 m/s in 4 s accelerates at (20 - 0) / 4 = 5 m/s².",
  },
  {
    subject: "Chemistry",
    keys: /(chemical )?bond|ionic|covalent|electron dot|lewis/,
    name: "Chemical Bonding",
    summary: "Atoms bond to reach a stable outer shell, usually eight electrons (the octet rule).",
    points: ["Ionic bonds: electrons transfer from a metal to a non-metal, forming oppositely charged ions", "Covalent bonds: non-metals share pairs of electrons", "Electron dot (Lewis) diagrams show only the outer-shell electrons"],
    example: "In NaCl, sodium gives one electron to chlorine, forming Na⁺ and Cl⁻ held by ionic bonding.",
  },
  {
    subject: "Biology",
    keys: /photosynth/,
    name: "Photosynthesis",
    summary: "Plants make glucose from carbon dioxide and water using light energy absorbed by chlorophyll.",
    points: ["Equation: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (in light, with chlorophyll)", "Light reactions in the thylakoids split water and make ATP and NADPH", "Dark reactions (Calvin cycle) in the stroma use ATP and NADPH to fix CO₂ into glucose"],
    example: "Light intensity, CO₂ concentration and temperature all limit the rate of photosynthesis.",
  },
  {
    subject: "Biology",
    keys: /cell|organelle|mitochondri|nucleus|chloroplast/,
    name: "Cell Structure",
    summary: "Cells are the basic unit of life. Plant and animal cells share many organelles but differ in a few key ones.",
    points: ["Nucleus controls the cell and holds DNA; mitochondria release energy by respiration", "Plant cells also have a cell wall, chloroplasts and a large vacuole", "The cell membrane controls what enters and leaves"],
    example: "A leaf cell has chloroplasts for photosynthesis; a human cheek cell does not.",
  },
  {
    subject: "English",
    keys: /tense|perfect|past|present|future/,
    name: "Tenses",
    summary: "Tense shows when an action happens. Each of past, present and future has simple, continuous, perfect and perfect continuous forms.",
    points: ["Present perfect: has/have + past participle (She has finished her work)", "Past perfect: had + past participle, for the earlier of two past actions", "Future perfect: will have + past participle (They will have arrived by six)"],
    example: "By the time the bell rang, we had completed the test (past perfect).",
  },
  {
    subject: "English",
    keys: /essay|paragraph|writing|composition/,
    name: "Essay Writing",
    summary: "A good essay has a clear introduction, well-organised body paragraphs and a short conclusion.",
    points: ["Introduction: hook the reader and state your main idea", "Body: one idea per paragraph with examples and details", "Conclusion: sum up without adding new points; check spelling and word count"],
    example: "For 'My Hometown', use one paragraph each for places, people and food.",
  },
  {
    subject: "Computer Science",
    keys: /loop|for loop|while|iteration|python/,
    name: "Loops in Python",
    summary: "A loop repeats a block of code. Python has for loops (over a sequence) and while loops (while a condition is true).",
    points: ["for i in range(5): runs 5 times with i = 0 to 4", "while count < 10: keeps running until the condition is false, so update count inside", "break exits a loop early; continue skips to the next round"],
    example: "for i in range(1, 6): print(i * i) prints 1, 4, 9, 16, 25.",
  },
];

function conceptReply(c: Concept): Reply {
  return {
    text: `${c.name} (${c.subject}): ${c.summary}`,
    tools: ["course notes", "knowledge vault"],
    blocks: [
      { kind: "list", items: c.points },
      { kind: "list", items: [`Example: ${c.example}`] },
      { kind: "links", items: [{ label: "Open Resources", href: "/student/resources" }] },
    ],
  };
}

/* ---------------- Practice and planning ---------------- */

function practiceReply(raw: string, q: string): Reply {
  const concept = concepts.find((c) => c.keys.test(q));
  const subject = concept?.subject ?? subjectOf(q) ?? "Mathematics";
  const topic =
    concept?.name ??
    raw.match(/\b(?:on|about|from|for)\s+(.+?)$/i)?.[1]?.replace(/[.?!]+$/, "").trim() ??
    subject;
  const count = Math.min(10, Math.max(3, Number(q.match(/(\d{1,2})\s*(?:question|mcq|item)/)?.[1] ?? 5)));
  const questions = generateQuestions({ subject, topic, types: ["mcq", "tf", "fill", "short"], count, marks: 1, salt: raw.length });
  return {
    text: `Here are ${count} practice questions on ${title(topic)} (${subject}). Try them first, then check the answer key below.`,
    tools: ["practice question maker"],
    blocks: [
      { kind: "list", items: questions.map((x, i) => `Q${i + 1}. ${x.text}${x.options ? ` (${x.options.join(" / ")})` : ""}`) },
      { kind: "list", items: questions.map((x, i) => `Answer ${i + 1}: ${x.answer}`) },
    ],
  };
}

const daysUntil = (iso: string) => Math.round((utcMs(iso) - utcMs(schoolToday)) / 86_400_000);
const dueText = (iso: string) => (daysUntil(iso) === 0 ? "Today" : daysUntil(iso) === 1 ? "Tomorrow" : `${shortDate(iso)} (in ${daysUntil(iso)} days)`);

function planReply(q: string): Reply {
  const subject = subjectOf(q);
  const open = studentAssessments
    .filter((a) => a.due >= schoolToday && (!subject || a.subject === subject || q.includes(a.title.toLowerCase())))
    .sort((a, b) => a.due.localeCompare(b.due));
  if (!open.length) return { text: `Nothing is due${subject ? ` in ${subject}` : ""} right now. A good use of time is revising this week's lessons or asking me for practice questions.`, tools: ["assessments"] };
  return {
    text: `You have ${plural(open.length, "piece")} of work coming up${subject ? ` in ${subject}` : ""}. Here is a study plan that starts with the nearest deadline:`,
    tools: ["assessments", "study planner"],
    blocks: [
      { kind: "table", columns: ["Work", "Subject", "Type", "Due"], rows: open.map((a) => [a.title, a.subject, a.kind, dueText(a.due)]) },
      {
        kind: "list",
        items: open.slice(0, 5).map((a) => {
          const d = daysUntil(a.due);
          const when = d <= 0 ? "Tonight" : d === 1 ? "Today and tomorrow" : `Over the next ${d} days`;
          return `${when}: ${a.kind === "Homework" ? "finish" : "revise for"} ${a.title}. ${a.details}`;
        }),
      },
      { kind: "links", items: [{ label: "Open Assessments", href: "/student/assessments" }] },
    ],
  };
}

function timetableReply(): Reply {
  const lessons = todaySchedule.filter((p) => !p.isBreak);
  return {
    text: `You have ${plural(lessons.length, "lesson")} today. Here is your timetable:`,
    tools: ["timetable"],
    blocks: [{ kind: "table", columns: ["Time", "Subject", "Teacher", "Room"], rows: lessons.map((p) => [`${p.start} to ${p.end}`, p.subject, p.teacher, p.room]) }],
  };
}

export const studentSuggestions: { group: string; prompts: string[] }[] = [
  { group: "Understand a topic", prompts: ["Explain quadratic equations", "What is photosynthesis?", "Explain Newton's laws of motion"] },
  { group: "Practice", prompts: ["Quiz me on chemical bonding", "Give me 5 practice questions on trigonometry", "Practice questions on tenses"] },
  { group: "Plan my study", prompts: ["What is due this week?", "Make a study plan for Physics", "What does the Physics Grade 10 textbook cover?"] },
];

/** Answers a student's course and study questions; refuses anything about personal data. */
export function respondStudent(raw: string, vault: VaultDoc[]): Reply {
  const q = raw.toLowerCase().trim();
  const who = otherPerson(q);
  if (who && !has(q, /(teach|subject|class|lesson)/)) return privacyReply(who);
  if (has(q, personalTerms)) return privacyReply();
  if (has(q, /(quiz me|test me|practice|practise|questions? on|mcqs?|revision questions|worksheet)/)) return practiceReply(raw, q);
  if (has(q, /(due|deadline|homework|assignment|study plan|plan my|revise|revision|prepare|exam prep|this week|upcoming|what should i study)/)) return planReply(q);
  if (has(q, /(timetable|schedule|today's classes|my classes|who teaches|period)/)) return timetableReply();
  const concept = concepts.find((c) => c.keys.test(q));
  if (concept) return conceptReply(concept);
  if (has(q, /(syllabus|curriculum|textbook|book|chapter|unit|cover|topic|lesson|exam|rule|conduct|policy)/)) return vaultReply(q, vault);
  if (has(q, /(explain|what is|what are|how does|how do|why|define|meaning|difference)/))
    return {
      text: "I don't have notes on that topic yet. Try naming the subject and chapter, or ask about one of these:",
      tools: ["course notes"],
      blocks: [{ kind: "list", items: concepts.map((c) => `${c.name} (${c.subject})`) }],
    };
  return {
    text: "I'm your study assistant. I can only help with your courses and studies: explaining topics, practice questions, study plans and your textbooks. Try one of these:",
    tools: [],
    blocks: [{ kind: "list", items: studentSuggestions.flatMap((g) => g.prompts.slice(0, 2)) }],
  };
}
