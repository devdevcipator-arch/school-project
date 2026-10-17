// Teacher portal: navigation + front-end mock data.
// Replace the mock objects with real API data in the backend phase.

import type { Tone } from "@/components/dashboard/ui";

export const teacherNav = [
  { href: "/teacher", label: "Overview", icon: "M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z" },
  { href: "/teacher/my-attendance", label: "My Attendance", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" },
  { href: "/teacher/class-attendance", label: "Class Attendance", icon: "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11" },
  { href: "/teacher/talents", label: "Talents", icon: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" },
  { href: "/teacher/assessments", label: "Assessments", icon: "M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3" },
  { href: "/teacher/reports", label: "Reports", icon: "M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6" },
  { href: "/teacher/resources", label: "Resources", icon: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z M11 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7 M14 8h3 M14 12h3" },
  { href: "/teacher/ai", label: "AI Assistant", icon: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6" },
];

/** Title block shown in the portal top bar, opposite the profile card. */
export const teacherTitles: Record<string, { eyebrow: string; title: string; description: string }> = {
  "/teacher": {
    eyebrow: "Overview",
    title: "Teacher Overview",
    description: "Your daily command center for attendance, progress, assessments and reports.",
  },
  "/teacher/my-attendance": {
    eyebrow: "My Attendance",
    title: "My Attendance Record",
    description: "Your check-ins, late arrivals and leave history.",
  },
  "/teacher/class-attendance": {
    eyebrow: "Class Attendance",
    title: "Class Attendance Register",
    description: "Mark and review attendance for every class you teach.",
  },
  "/teacher/talents": {
    eyebrow: "Talents",
    title: "Student Talents",
    description: "Spot and endorse talented students in your classes.",
  },
  "/teacher/assessments": {
    eyebrow: "Assessments",
    title: "Assessments & Quizzes",
    description: "Create, schedule and grade tests for your classes.",
  },
  "/teacher/reports": {
    eyebrow: "Reports",
    title: "Student Reports",
    description: "Prepare and send digital report cards.",
  },
  "/teacher/resources": {
    eyebrow: "Resources",
    title: "Teaching Resources",
    description: "Helping books, syllabus guides and study material for your classes.",
  },
  "/teacher/ai": {
    eyebrow: "AI Assistant",
    title: "Teacher AI Assistant",
    description: "Generate quizzes, lesson ideas and feedback in seconds.",
  },
};

export const teacher = {
  name: "Ali Raza",
  firstName: "Ali",
  initials: "AR",
  role: "Class Teacher",
  session: "Session 2026-27",
};

export const teacherToday = {
  checkIn: "07:50 AM",
  classesRemaining: 3,
  classesTotal: 6,
};

export const teacherNotifications = [
  { text: "Grade 10 - Section A attendance for today is not updated after period 3", tone: "warn" as const, when: "15m ago" },
  { text: "Hamza Ali (Grade 10 - Section A) has been absent 3 days in a row", tone: "danger" as const, when: "1h ago" },
  { text: "5 monthly progress reports are waiting for your review", tone: "warn" as const, when: "3h ago" },
];

// ---------- Overview: one data set per assigned class ----------

export type AssessmentFormat = "MCQ Test" | "Subjective / Task" | "AI-Generated Quiz";
export type AssessmentState = "Active" | "Due today" | "Scheduled";
export type ResourceKind = "Textbook" | "Reference PDF" | "Syllabus guide";

export const assessmentStateTone: Record<AssessmentState, Tone> = {
  Active: "ok",
  "Due today": "warn",
  Scheduled: "neutral",
};

export type ClassOverview = {
  id: string;
  label: string;
  curriculum: number; // % of syllabus covered
  performanceIndex: number; // 0-100
  attendance: { present: number; absent: number; leave: number; updatedAt: string };
  absentees: { name: string; roll: string; note: string; tone: Tone }[];
  subjects: { name: string; percent: number }[];
  avgScore: number;
  lastScores: { title: string; percent: number }[];
  assessments: { title: string; subject: string; format: AssessmentFormat; state: AssessmentState; submitted: number; total: number; deadline: string }[];
  resources: { books: number; guides: number; materials: number; top: { title: string; kind: ResourceKind; meta: string; opens: number }[] };
  reports: { generated: number; pending: number; attention: { name: string; note: string }[] };
};

export const PASS_MARK = 60;

export const classOverviews: ClassOverview[] = [
  {
    id: "10a",
    label: "Grade 10 - Section A",
    curriculum: 78,
    performanceIndex: 74,
    attendance: { present: 32, absent: 2, leave: 1, updatedAt: "08:05 AM" },
    absentees: [
      { name: "Hamza Ali", roll: "Roll 07", note: "3 days in a row", tone: "danger" },
      { name: "Zainab Fatima", roll: "Roll 21", note: "No reason given", tone: "warn" },
      { name: "Usman Saeed", roll: "Roll 28", note: "On leave (medical)", tone: "neutral" },
    ],
    subjects: [
      { name: "Mathematics", percent: 82 },
      { name: "Physics", percent: 70 },
      { name: "Chemistry", percent: 65 },
      { name: "English", percent: 88 },
      { name: "Computer Science", percent: 76 },
    ],
    avgScore: 74,
    lastScores: [
      { title: "Algebra Unit Test", percent: 71 },
      { title: "Optics Quiz", percent: 77 },
      { title: "Organic Basics", percent: 69 },
    ],
    assessments: [
      { title: "Algebra Mid-Term Quiz", subject: "Mathematics", format: "MCQ Test", state: "Active", submitted: 28, total: 35, deadline: "Closes in 2h 15m" },
      { title: "Thermodynamics Assignment", subject: "Physics", format: "Subjective / Task", state: "Due today", submitted: 19, total: 35, deadline: "Due today, 8:00 PM" },
      { title: "Chemical Bonding Practice", subject: "Chemistry", format: "AI-Generated Quiz", state: "Active", submitted: 24, total: 35, deadline: "Closes tomorrow" },
      { title: "Essay Writing Task", subject: "English", format: "Subjective / Task", state: "Active", submitted: 12, total: 35, deadline: "Closes in 3 days" },
      { title: "Trigonometry Test", subject: "Mathematics", format: "MCQ Test", state: "Scheduled", submitted: 0, total: 35, deadline: "Mon, 26 Oct" },
    ],
    resources: {
      books: 6,
      guides: 3,
      materials: 5,
      top: [
        { title: "Mathematics Grade 10 (Punjab Textbook)", kind: "Textbook", meta: "PDF · 312 pages", opens: 48 },
        { title: "Physics Numericals Workbook", kind: "Reference PDF", meta: "PDF · 96 pages", opens: 31 },
        { title: "Chemistry Syllabus Guide 2026-27", kind: "Syllabus guide", meta: "PDF · 18 pages", opens: 22 },
      ],
    },
    reports: {
      generated: 30,
      pending: 5,
      attention: [
        { name: "Hamza Ali", note: "Below pass mark in 2 subjects" },
        { name: "Bilal Ahmed", note: "Chemistry average 48%" },
        { name: "Sana Tariq", note: "Score dropped 15% this month" },
      ],
    },
  },
  {
    id: "9b",
    label: "Grade 9 - Section B",
    curriculum: 71,
    performanceIndex: 68,
    attendance: { present: 30, absent: 1, leave: 2, updatedAt: "08:12 AM" },
    absentees: [
      { name: "Ahmed Nawaz", roll: "Roll 03", note: "No reason given", tone: "warn" },
      { name: "Maryam Iqbal", roll: "Roll 15", note: "On leave (family)", tone: "neutral" },
      { name: "Daniyal Shah", roll: "Roll 19", note: "On leave (sports trip)", tone: "neutral" },
    ],
    subjects: [
      { name: "Mathematics", percent: 74 },
      { name: "Physics", percent: 66 },
      { name: "Chemistry", percent: 61 },
      { name: "Biology", percent: 79 },
    ],
    avgScore: 68,
    lastScores: [
      { title: "Linear Equations Quiz", percent: 64 },
      { title: "Motion Unit Test", percent: 70 },
      { title: "Cell Biology Quiz", percent: 72 },
    ],
    assessments: [
      { title: "Linear Equations Retest", subject: "Mathematics", format: "MCQ Test", state: "Due today", submitted: 26, total: 33, deadline: "Due today, 6:00 PM" },
      { title: "Force & Motion Worksheet", subject: "Physics", format: "Subjective / Task", state: "Active", submitted: 15, total: 33, deadline: "Closes in 2 days" },
      { title: "Periodic Table Challenge", subject: "Chemistry", format: "AI-Generated Quiz", state: "Scheduled", submitted: 0, total: 33, deadline: "Wed, 21 Oct" },
    ],
    resources: {
      books: 5,
      guides: 2,
      materials: 4,
      top: [
        { title: "Physics Grade 9 Textbook", kind: "Textbook", meta: "PDF · 264 pages", opens: 39 },
        { title: "Biology Diagrams Handbook", kind: "Reference PDF", meta: "PDF · 54 pages", opens: 27 },
        { title: "Mathematics Syllabus Guide 2026-27", kind: "Syllabus guide", meta: "PDF · 14 pages", opens: 18 },
      ],
    },
    reports: {
      generated: 26,
      pending: 7,
      attention: [
        { name: "Ahmed Nawaz", note: "Below pass mark in Mathematics" },
        { name: "Hira Asif", note: "Missed 2 assessments" },
      ],
    },
  },
  {
    id: "8a",
    label: "Grade 8 - Section A",
    curriculum: 84,
    performanceIndex: 81,
    attendance: { present: 34, absent: 0, leave: 1, updatedAt: "07:58 AM" },
    absentees: [{ name: "Ayesha Khan", roll: "Roll 02", note: "On leave (medical)", tone: "neutral" }],
    subjects: [
      { name: "Mathematics", percent: 86 },
      { name: "General Science", percent: 81 },
      { name: "English", percent: 90 },
    ],
    avgScore: 81,
    lastScores: [
      { title: "Fractions Test", percent: 83 },
      { title: "Science Quiz 3", percent: 79 },
      { title: "Grammar Check", percent: 82 },
    ],
    assessments: [
      { title: "Fractions & Decimals Quiz", subject: "Mathematics", format: "AI-Generated Quiz", state: "Active", submitted: 31, total: 35, deadline: "Closes in 5h" },
      { title: "Science Project Report", subject: "General Science", format: "Subjective / Task", state: "Scheduled", submitted: 0, total: 35, deadline: "Fri, 23 Oct" },
    ],
    resources: {
      books: 4,
      guides: 2,
      materials: 3,
      top: [
        { title: "Mathematics Grade 8 Textbook", kind: "Textbook", meta: "PDF · 228 pages", opens: 35 },
        { title: "Science Experiments Manual", kind: "Reference PDF", meta: "PDF · 42 pages", opens: 21 },
        { title: "English Syllabus Guide 2026-27", kind: "Syllabus guide", meta: "PDF · 12 pages", opens: 12 },
      ],
    },
    reports: {
      generated: 33,
      pending: 2,
      attention: [{ name: "Fahad Mir", note: "Science average 55%" }],
    },
  },
];
