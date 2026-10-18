// Teacher portal, Assessments & Tasks Hub: types, mock assessments, submissions and a mock AI question generator.
// The generator stands in for the real AI service; swap `generateQuestions` for an API call in the backend phase.

import { gradeNum, hash, type Student } from "./students";

export type AssessmentStatus = "live" | "scheduled" | "closed" | "draft";
export type Format = "ai-quiz" | "homework" | "term-test" | "project";
export type QuestionType = "mcq" | "tf" | "short" | "fill";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Adaptive";
export type SubmissionMode = "online" | "physical";

export const formatMeta: Record<Format, { label: string; style: string }> = {
  "ai-quiz": { label: "MCQ Quiz - AI Generated", style: "bg-ink text-surface" },
  homework: { label: "Written Homework", style: "bg-accent/15 text-[#3d6e71]" },
  "term-test": { label: "Term Test", style: "bg-primary/10 text-primary" },
  project: { label: "Project / Task", style: "bg-primary/10 text-primary" },
};

export const questionTypeMeta: Record<QuestionType, { label: string; short: string }> = {
  mcq: { label: "MCQs", short: "MCQ" },
  tf: { label: "True / False", short: "True / False" },
  short: { label: "Short Conceptual", short: "Short answer" },
  fill: { label: "Fill in the blanks", short: "Fill in the blank" },
};

export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  /** MCQ options; True/False uses ["True", "False"]. */
  options?: string[];
  answer: string;
  explanation: string;
  marks: number;
};

export type Attachment = { name: string; size: number; url?: string };

export type Assessment = {
  id: string;
  title: string;
  topic: string;
  section: string;
  subject: string;
  format: Format;
  status: AssessmentStatus;
  /** ISO datetimes. */
  start: string;
  due: string;
  durationMins?: number;
  totalMarks: number;
  difficulty?: Difficulty;
  questions?: Question[];
  instructionsHtml?: string;
  instructionsText?: string;
  attachments?: Attachment[];
  mode: SubmissionMode;
  /** Objective tests are marked automatically. */
  autoGraded: boolean;
  released: boolean;
};

export type SubmissionState = "on-time" | "late" | "none";

export type Submission = {
  studentId: string;
  state: SubmissionState;
  submittedAt?: string;
  /** Per-question result for auto-graded tests. */
  results?: boolean[];
  /** null until marked. */
  score: number | null;
  file?: { name: string; kind: "pdf" | "image" };
  remarks: string;
};

export const sectionSubjects = (section: string) =>
  gradeNum(section) >= 9 ? ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science"] : ["Mathematics", "General Science", "English", "Computer Science"];

/* ---------------- Mock AI question generator ---------------- */

type Bank = Omit<Question, "id" | "marks">[];

const banks: Record<string, Bank> = {
  Mathematics: [
    { type: "mcq", text: "What are the roots of x² - 5x + 6 = 0?", options: ["2 and 3", "-2 and -3", "1 and 6", "-1 and 6"], answer: "2 and 3", explanation: "Factorise: (x - 2)(x - 3) = 0, so x = 2 or x = 3." },
    { type: "mcq", text: "The discriminant of ax² + bx + c = 0 is:", options: ["b² - 4ac", "b² + 4ac", "4ac - b²", "2a"], answer: "b² - 4ac", explanation: "The discriminant b² - 4ac decides the nature of the roots." },
    { type: "tf", text: "A quadratic equation can have at most two real roots.", options: ["True", "False"], answer: "True", explanation: "A polynomial of degree 2 has at most 2 roots." },
    { type: "fill", text: "If sin θ = 3/5 and θ is acute, then cos θ = ____.", answer: "4/5", explanation: "cos θ = √(1 - sin²θ) = √(1 - 9/25) = 4/5." },
    { type: "short", text: "Explain why the sum of the roots of ax² + bx + c = 0 equals -b/a.", answer: "From (x - α)(x - β) = x² - (α + β)x + αβ, comparing with x² + (b/a)x + c/a gives α + β = -b/a.", explanation: "Compare coefficients of the factorised and standard forms." },
    { type: "mcq", text: "What is the value of tan 45°?", options: ["1", "0", "√3", "1/√3"], answer: "1", explanation: "In a 45-45-90 triangle the opposite and adjacent sides are equal." },
  ],
  Physics: [
    { type: "mcq", text: "Which law states that energy can neither be created nor destroyed?", options: ["First law of thermodynamics", "Second law of thermodynamics", "Newton's first law", "Ohm's law"], answer: "First law of thermodynamics", explanation: "The first law is the law of conservation of energy for thermal systems." },
    { type: "tf", text: "Heat flows naturally from a colder body to a hotter body.", options: ["True", "False"], answer: "False", explanation: "By the second law, heat flows from hot to cold unless work is done." },
    { type: "fill", text: "The SI unit of force is the ____.", answer: "newton", explanation: "1 newton = 1 kg·m/s²." },
    { type: "short", text: "Why does a metal spoon feel colder than a wooden spoon at the same temperature?", answer: "Metal conducts heat away from the hand faster than wood, so the hand loses heat quickly and it feels colder.", explanation: "Perceived temperature depends on the rate of heat transfer (thermal conductivity)." },
    { type: "mcq", text: "Specific heat capacity is measured in:", options: ["J/kg·K", "J/s", "W/m²", "N/m"], answer: "J/kg·K", explanation: "Energy per unit mass per unit temperature change." },
  ],
  Chemistry: [
    { type: "mcq", text: "Which type of bond is formed by the transfer of electrons?", options: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"], answer: "Ionic bond", explanation: "Ionic bonds form when electrons move from a metal to a non-metal." },
    { type: "tf", text: "Noble gases readily form chemical bonds.", options: ["True", "False"], answer: "False", explanation: "Noble gases have full outer shells and are very unreactive." },
    { type: "fill", text: "The chemical formula of table salt is ____.", answer: "NaCl", explanation: "Sodium chloride: one Na⁺ ion and one Cl⁻ ion." },
    { type: "short", text: "Why does water have a higher boiling point than hydrogen sulfide?", answer: "Water molecules form strong hydrogen bonds with each other, which need more energy to break.", explanation: "Oxygen is far more electronegative than sulfur, enabling hydrogen bonding." },
  ],
  Biology: [
    { type: "mcq", text: "Where does photosynthesis take place in a plant cell?", options: ["Chloroplast", "Mitochondria", "Nucleus", "Ribosome"], answer: "Chloroplast", explanation: "Chloroplasts contain chlorophyll which captures light energy." },
    { type: "tf", text: "Cellular respiration releases energy from glucose.", options: ["True", "False"], answer: "True", explanation: "Glucose is broken down to release energy stored as ATP." },
    { type: "fill", text: "The green pigment in leaves is called ____.", answer: "chlorophyll", explanation: "Chlorophyll absorbs red and blue light and reflects green." },
    { type: "short", text: "State two differences between photosynthesis and cellular respiration.", answer: "Photosynthesis stores energy and uses CO₂ and water; respiration releases energy and produces CO₂ and water.", explanation: "They are broadly reverse processes." },
  ],
  English: [
    { type: "mcq", text: "Choose the correct passive form: 'The teacher praised the students.'", options: ["The students were praised by the teacher.", "The students are praised by the teacher.", "The teacher was praised by the students.", "The students had praised the teacher."], answer: "The students were praised by the teacher.", explanation: "Past simple active becomes 'was/were + past participle'." },
    { type: "fill", text: "She has been living here ____ 2019.", answer: "since", explanation: "'Since' is used with a point in time." },
    { type: "tf", text: "An adverb can modify a verb, an adjective or another adverb.", options: ["True", "False"], answer: "True", explanation: "That is the definition of an adverb." },
    { type: "short", text: "Write one sentence using a metaphor and name what is being compared.", answer: "e.g. 'The classroom was a zoo' compares a noisy classroom to a zoo.", explanation: "A metaphor states a comparison without 'like' or 'as'." },
  ],
};

const conceptWords = ["key principle", "main idea", "core definition", "practical application", "common misconception"];

/** Template question about any topic, used when the bank runs out or for unknown subjects. */
function templateQuestion(type: QuestionType, topic: string, n: number): Bank[number] {
  const concept = conceptWords[n % conceptWords.length];
  switch (type) {
    case "mcq":
      return {
        type,
        text: `Which statement best describes the ${concept} of ${topic}?`,
        options: [`It explains how ${topic} works in real situations`, `It is unrelated to ${topic}`, "It applies only to historical examples", "None of these"],
        answer: `It explains how ${topic} works in real situations`,
        explanation: `The ${concept} links ${topic} to how it is used and observed.`,
      };
    case "tf":
      return { type, text: `${topic} can be explained with examples from everyday life.`, options: ["True", "False"], answer: "True", explanation: `Everyday examples are a standard way to illustrate ${topic}.` };
    case "fill":
      return { type, text: `The ____ of ${topic} is the first thing students should be able to state.`, answer: "definition", explanation: `Being able to define ${topic} is the base for the rest of the chapter.` };
    default:
      return { type, text: `In 3 to 4 lines, explain the ${concept} of ${topic} with one example.`, answer: `A clear statement of the ${concept} of ${topic} with a relevant example.`, explanation: "Marks for a correct idea, a clear explanation and a relevant example." };
  }
}

let aid = 0;
/** Id for an assessment created in this session. */
export const newAssessmentId = () => `a-new-${Date.now().toString(36)}-${aid++}`;

let qid = 0;
const newId = () => `q${Date.now().toString(36)}${(qid++).toString(36)}`;

/** Mock "AI": draws from the subject bank first, then fills with topic templates. */
export function generateQuestions(opts: { subject: string; topic: string; types: QuestionType[]; count: number; marks: number; salt?: number }): Question[] {
  const bank = (banks[opts.subject] ?? []).filter((q) => opts.types.includes(q.type));
  const salt = opts.salt ?? 0;
  const out: Question[] = [];
  for (let i = 0; i < opts.count; i++) {
    const type = opts.types[i % opts.types.length];
    const fromBank = bank.filter((q) => q.type === type);
    const pickIdx = Math.floor(hash(i + salt * 31, opts.topic.length + salt) * 1000);
    const base = fromBank.length && i < bank.length ? fromBank[(i + salt) % fromBank.length] : templateQuestion(type, opts.topic || opts.subject, pickIdx);
    // Avoid exact duplicates inside one paper.
    const dup = out.some((q) => q.text === base.text);
    const q = dup ? templateQuestion(type, opts.topic || opts.subject, pickIdx + i) : base;
    out.push({ ...q, options: q.options ? [...q.options] : undefined, id: newId(), marks: opts.marks });
  }
  return out;
}

/** One fresh question of the same type, for "Regenerate". */
export function regenerateQuestion(q: Question, subject: string, topic: string, salt: number): Question {
  const [fresh] = generateQuestions({ subject, topic, types: [q.type], count: 1, marks: q.marks, salt: salt + 7 });
  return fresh.text === q.text ? { ...templateQuestion(q.type, topic || subject, salt + 3), id: newId(), marks: q.marks } : fresh;
}

/* ---------------- Seed assessments ---------------- */

const at = (now: Date, hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString();

type SeedRow = [title: string, topic: string, subject: string, format: Format, status: AssessmentStatus, startH: number, dueH: number, marks: number, mode?: SubmissionMode];

const seedRows: Record<string, SeedRow[]> = {
  "10-A": [
    ["Algebra Mid-Term Quiz", "Quadratic equations", "Mathematics", "ai-quiz", "live", -2, 2.25, 20],
    ["Thermodynamics Assignment", "Laws of thermodynamics", "Physics", "homework", "live", -26, 10, 25],
    ["Chemical Bonding Practice", "Ionic and covalent bonds", "Chemistry", "ai-quiz", "live", -5, 24, 15],
    ["Essay Writing Task", "Argumentative essay", "English", "project", "live", -30, 72, 30, "physical"],
    ["Trigonometry Test", "Trigonometric ratios", "Mathematics", "term-test", "scheduled", 190, 191.5, 50, "physical"],
    ["Optics Quiz", "Reflection and refraction", "Physics", "ai-quiz", "closed", -240, -216, 20],
    ["Linear Algebra Worksheet", "Matrices and determinants", "Mathematics", "homework", "closed", -170, -98, 25],
    ["Organic Chemistry Basics", "Hydrocarbons", "Chemistry", "ai-quiz", "draft", 48, 72, 20],
  ],
  "9-B": [
    ["Linear Equations Retest", "Linear equations", "Mathematics", "ai-quiz", "live", -6, 8, 20],
    ["Force & Motion Worksheet", "Newton's laws", "Physics", "homework", "live", -20, 48, 20],
    ["Periodic Table Challenge", "Periodic table", "Chemistry", "ai-quiz", "scheduled", 70, 94, 15],
    ["Cell Biology Quiz", "Cell structure", "Biology", "ai-quiz", "closed", -200, -176, 20],
    ["Motion Unit Test", "Motion", "Physics", "term-test", "closed", -150, -148, 40, "physical"],
  ],
  "8-A": [
    ["Fractions & Decimals Quiz", "Fractions and decimals", "Mathematics", "ai-quiz", "live", -3, 5, 15],
    ["Science Project Report", "Water cycle", "General Science", "project", "scheduled", 100, 140, 30],
    ["Grammar Check", "Tenses", "English", "ai-quiz", "closed", -180, -156, 15],
  ],
};

export function seedAssessments(now: Date): Assessment[] {
  return Object.entries(seedRows).flatMap(([section, rows]) =>
    rows.map(([title, topic, subject, format, status, startH, dueH, marks, mode = "online"], i): Assessment => {
      const auto = format === "ai-quiz";
      const count = auto ? Math.max(5, Math.round(marks / 2)) : 0;
      return {
        id: `a-${section}-${i}`,
        title,
        topic,
        section,
        subject,
        format,
        status,
        start: at(now, startH),
        due: at(now, dueH),
        durationMins: auto ? 30 : format === "term-test" ? 90 : undefined,
        totalMarks: auto ? count * Math.round(marks / count) : marks,
        difficulty: auto ? "Medium" : undefined,
        questions: auto ? generateQuestions({ subject, topic, types: ["mcq", "tf", "fill", "short"], count, marks: Math.round(marks / count) }) : undefined,
        instructionsText: auto ? undefined : `Complete the ${topic.toLowerCase()} task. Show all working clearly and write your name and roll number on every page.`,
        attachments: auto ? undefined : [{ name: `${title.replace(/\W+/g, "-")}.pdf`, size: 240_000 }],
        mode,
        autoGraded: auto,
        released: status === "closed" && i % 2 === 0,
      };
    }),
  );
}

/** Deterministic mock submissions for an assessment, based on each student's seed. */
export function seedSubmissions(a: Assessment, roster: Student[]): Submission[] {
  const key = a.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const submitShare = a.status === "closed" ? 0.92 : a.status === "live" ? 0.45 + hash(key, 3) * 0.4 : 0;
  return roster.map((s) => {
    const r = hash(s.seed, key);
    if (r >= submitShare) return { studentId: s.id, state: "none", score: null, remarks: "" };
    const late = a.status === "closed" && hash(s.seed, key + 1) < 0.12;
    const due = new Date(a.due).getTime();
    const submittedAt = new Date(late ? due + hash(s.seed, key + 2) * 20 * 3_600_000 : Math.min(due, Date.now()) - hash(s.seed, key + 2) * 18 * 3_600_000).toISOString();
    // Ability tracks attendance a little, plus noise.
    const ability = 0.45 + (s.termRate / 100) * 0.3 + hash(s.seed, key + 4) * 0.25;
    if (a.autoGraded && a.questions) {
      const results = a.questions.map((_, qi) => hash(s.seed * 7 + qi, key) < ability);
      const score = a.questions.reduce((t, q, qi) => t + (results[qi] ? q.marks : 0), 0);
      return { studentId: s.id, state: late ? "late" : "on-time", submittedAt, results, score, remarks: "" };
    }
    const reviewed = hash(s.seed, key + 5) < (a.status === "closed" ? 0.85 : 0.35);
    const first = s.name.split(" ")[0].toLowerCase();
    return {
      studentId: s.id,
      state: late ? "late" : "on-time",
      submittedAt,
      score: reviewed ? Math.min(a.totalMarks, Math.round(a.totalMarks * ability)) : null,
      file: a.mode === "online" ? { name: `${first}-${a.title.toLowerCase().replace(/\W+/g, "-")}.${hash(s.seed, key + 6) < 0.5 ? "pdf" : "jpg"}`, kind: hash(s.seed, key + 6) < 0.5 ? "pdf" : "image" } : undefined,
      remarks: reviewed ? (ability > 0.8 ? "Excellent work, well presented." : ability > 0.65 ? "Good effort. Review the marked mistakes." : "Needs more practice. See me after class.") : "",
    };
  });
}
