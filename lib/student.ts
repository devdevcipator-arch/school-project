// Student portal: navigation, page titles and the structural blueprint of each page.
// Page content is filled in page by page; replace mock objects with API data in the backend phase.

export const studentNav = [
  { href: "/student", label: "Overview", icon: "M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z" },
  { href: "/student/attendance", label: "My Attendance", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" },
  { href: "/student/assessments", label: "Assessments", icon: "M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3" },
  { href: "/student/reports", label: "Reports", icon: "M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6" },
  { href: "/student/resources", label: "Resources", icon: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z M11 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7 M14 8h3 M14 12h3" },
  { href: "/student/notices", label: "Notices", icon: "M3 11l15-6v14L3 13z M7 13v5h3v-4" },
  { href: "/student/ai", label: "Student AI", icon: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6" },
];

/** Title block shown in the portal top bar, opposite the profile card. */
export const studentTitles: Record<string, { eyebrow: string; title: string; description: string }> = {
  "/student": {
    eyebrow: "Overview",
    title: "My Day",
    description: "Your daily hub: urgent notices, attendance, pending quizzes and today's schedule.",
  },
  "/student/attendance": {
    eyebrow: "My Attendance",
    title: "My Attendance Record",
    description: "Your term attendance, monthly log and absence breakdown. Read-only.",
  },
  "/student/assessments": {
    eyebrow: "Assessments",
    title: "Tests, Quizzes & Homework",
    description: "Take timed quizzes, submit homework and review your score breakdowns.",
  },
  "/student/reports": {
    eyebrow: "Reports",
    title: "Report Cards & Transcripts",
    description: "Official term report cards, your grades ledger and teacher remarks.",
  },
  "/student/resources": {
    eyebrow: "Resources",
    title: "Subject Folders & Library",
    description: "Textbooks, helping materials and lecture slides shared by your teachers.",
  },
  "/student/notices": {
    eyebrow: "Notices",
    title: "Notices & Circulars",
    description: "School-wide alerts from the Principal and class circulars from your teachers.",
  },
  "/student/ai": {
    eyebrow: "Student AI",
    title: "Student AI Study Copilot",
    description: "Ask about any concept, get questions explained and study along your curriculum.",
  },
};

export const student = {
  name: "Ayesha Khan",
  firstName: "Ayesha",
  initials: "AK",
  classLabel: "Grade 10 - Section A",
  roll: "Roll 02",
  session: "Session 2026-27",
};

export const studentNotifications = [
  { text: "Algebra Mid-Term Quiz closes in 2 hours", tone: "warn" as const, when: "10m ago" },
  { text: "Term 1 report card has been published", tone: "warn" as const, when: "2h ago" },
  { text: "School closed on Friday for a public holiday", tone: "danger" as const, when: "1d ago" },
];

// ---------- Overview ("My Day") ----------

export type NoticeSource = "Principal" | "Class teacher";

export const urgentNotices: { source: NoticeSource; title: string; body: string; when: string; tone: "warn" | "danger" }[] = [
  {
    source: "Principal",
    title: "School closed on Friday",
    body: "The school will remain closed this Friday for a public holiday. Classes resume on Monday.",
    when: "Yesterday",
    tone: "danger",
  },
  {
    source: "Class teacher",
    title: "Science lab coats required",
    body: "Bring your lab coat for Thursday's practical. Students without one will not enter the lab.",
    when: "Today, 8:10 AM",
    tone: "warn",
  },
];

export const studentAttendance = { present: 68, absent: 3, leave: 2, streak: 12 };

export type PendingState = "Closes today" | "Open" | "Due this week";

export const pendingWork: { title: string; subject: string; kind: "Quiz" | "Test" | "Homework"; state: PendingState }[] = [
  { title: "Algebra Mid-Term Quiz", subject: "Mathematics", kind: "Quiz", state: "Closes today" },
  { title: "Photosynthesis Check", subject: "Biology", kind: "Quiz", state: "Open" },
  { title: "Essay: My Hometown", subject: "English", kind: "Homework", state: "Due this week" },
  { title: "Chemical Bonding Worksheet", subject: "Chemistry", kind: "Homework", state: "Due this week" },
];

export const latestResult = {
  title: "Physics Unit Test 2",
  subject: "Physics",
  score: 42,
  total: 50,
  classAverage: 71,
  gradedOn: "18 Oct",
};

export type Period = { start: string; end: string; subject: string; teacher: string; room: string; isBreak?: boolean };

/** Today's timetable. Times are 24h "HH:MM" so the current period can be found from the clock. */
export const todaySchedule: Period[] = [
  { start: "08:00", end: "08:45", subject: "Mathematics", teacher: "Mr. Usman Ali", room: "Room 10A" },
  { start: "08:45", end: "09:30", subject: "Physics", teacher: "Ms. Sana Iqbal", room: "Physics Lab" },
  { start: "09:30", end: "10:15", subject: "English", teacher: "Mrs. Hina Shah", room: "Room 10A" },
  { start: "10:15", end: "10:35", subject: "Break", teacher: "", room: "", isBreak: true },
  { start: "10:35", end: "11:20", subject: "Chemistry", teacher: "Mr. Bilal Ahmed", room: "Chemistry Lab" },
  { start: "11:20", end: "12:05", subject: "Biology", teacher: "Dr. Farah Naz", room: "Biology Lab" },
  { start: "12:05", end: "12:50", subject: "Urdu", teacher: "Mr. Kamran Raza", room: "Room 10A" },
  { start: "12:50", end: "13:30", subject: "Computer Science", teacher: "Ms. Ayesha Malik", room: "Computer Lab" },
];

export const dueSoon: { title: string; subject: string; day: string; date: string; urgent?: boolean }[] = [
  { title: "Algebra Mid-Term Quiz", subject: "Mathematics", day: "Today", date: "21 Oct", urgent: true },
  { title: "Lab coat for practical", subject: "Chemistry", day: "Thu", date: "23 Oct" },
  { title: "Essay: My Hometown", subject: "English", day: "Thu", date: "23 Oct" },
  { title: "Chemical Bonding Worksheet", subject: "Chemistry", day: "Sat", date: "25 Oct" },
  { title: "Urdu poem recitation", subject: "Urdu", day: "Mon", date: "27 Oct" },
];

// ---------- Page blueprints: the planned sections of each page ----------

/** One planned section on a page. `span` is its width on the 12-column desktop grid. */
export type BlueprintSection = { title: string; note: string; icon: string; span: 4 | 6 | 8 | 12; tall?: boolean };

const i = {
  alert: "M12 4l9 16H3z M12 10v4 M12 17v.5",
  ring: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 3a9 9 0 0 1 9 9",
  quiz: "M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3",
  calendar: "M8 3v3 M16 3v3 M4 7h16v13H4z M4 11h16",
  clock: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2",
  pie: "M12 3v9h9 M12 3a9 9 0 1 0 9 9",
  timer: "M12 8a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M12 11v4 M10 3h4 M12 3v2",
  upload: "M12 20V9 M7 14l5-5 5 5 M5 4h14",
  chart: "M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6",
  vault: "M4 4h16v16H4z M12 12a2 2 0 1 0 0-.01 M12 8v2 M12 14v2",
  ledger: "M5 4h14v16H5z M9 8h6 M9 12h6 M9 16h3",
  chat: "M4 5h16v11H9l-5 4z",
  download: "M12 4v11 M7 10l5 5 5-5 M5 20h14",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  book: "M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z M11 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7",
  slides: "M3 4h18v12H3z M12 16v4 M8 20h8",
  megaphone: "M3 11l15-6v14L3 13z M7 13v5h3v-4",
  users: "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7",
  filter: "M4 5h16l-6 8v6l-4-2v-4z",
  spark: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6",
  bulb: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z",
  history: "M4 12a8 8 0 1 0 2.3-5.7 M4 4v4h4 M12 8v4l3 2",
};

export const studentBlueprints: Record<string, BlueprintSection[]> = {
  "/student": [
    { title: "Urgent notice banner", note: "Pinned alerts from the Principal and class teacher", icon: i.alert, span: 12 },
    { title: "Attendance ring", note: "Term attendance percentage at a glance", icon: i.ring, span: 4 },
    { title: "Pending quizzes", note: "Counter of open tests and homework due", icon: i.quiz, span: 4 },
    { title: "Latest result", note: "Most recent graded assessment", icon: i.chart, span: 4 },
    { title: "Daily schedule", note: "Today's periods, subjects and teachers", icon: i.clock, span: 8, tall: true },
    { title: "Due soon", note: "Upcoming deadlines this week", icon: i.calendar, span: 4, tall: true },
  ],
  "/student/attendance": [
    { title: "Term percentage dial", note: "Attendance for the current term", icon: i.ring, span: 4 },
    { title: "Present / Absent / Leave", note: "Day counts this term", icon: i.pie, span: 8 },
    { title: "Monthly calendar log", note: "Color-coded days: P, A, L", icon: i.calendar, span: 8, tall: true },
    { title: "Absence breakdown", note: "Absences by month and reason", icon: i.chart, span: 4, tall: true },
  ],
  "/student/assessments": [
    { title: "Filters & tabs", note: "Active, Due, Submitted, Graded", icon: i.filter, span: 12 },
    { title: "Active tests & quizzes", note: "AI-generated and teacher tests open now", icon: i.quiz, span: 8, tall: true },
    { title: "Homework tasks", note: "Assignments with deadlines", icon: i.calendar, span: 4, tall: true },
    { title: "Timed quiz runner", note: "Full-screen test with countdown timer", icon: i.timer, span: 6 },
    { title: "Submission portal", note: "Upload files and answers for tasks", icon: i.upload, span: 6 },
    { title: "Score breakdown", note: "Per-question and per-topic results", icon: i.chart, span: 12 },
  ],
  "/student/reports": [
    { title: "Term-wise report vault", note: "Published report cards by term", icon: i.vault, span: 4, tall: true },
    { title: "GPA & grades ledger", note: "Subject grades across terms", icon: i.ledger, span: 8, tall: true },
    { title: "Teacher remarks", note: "Qualitative comments from teachers", icon: i.chat, span: 8 },
    { title: "PDF download", note: "Download the official report card", icon: i.download, span: 4 },
  ],
  "/student/resources": [
    { title: "Search & filters", note: "Find by subject, type or title", icon: i.filter, span: 12 },
    { title: "Subject folders", note: "One folder per subject", icon: i.folder, span: 12 },
    { title: "Textbooks", note: "Official course books (read-only)", icon: i.book, span: 4 },
    { title: "Helping materials", note: "Notes, worksheets and guides", icon: i.ledger, span: 4 },
    { title: "Lecture slides", note: "Slides uploaded by teachers", icon: i.slides, span: 4 },
  ],
  "/student/notices": [
    { title: "Source filters", note: "All, Principal, Class teacher", icon: i.filter, span: 12 },
    { title: "School-wide alerts", note: "Announcements from the Principal", icon: i.megaphone, span: 6, tall: true },
    { title: "Class circulars", note: "Notices from your teachers", icon: i.users, span: 6, tall: true },
  ],
  "/student/ai": [
    { title: "Conversation history", note: "Past study sessions", icon: i.history, span: 4, tall: true },
    { title: "Chat workspace", note: "Concept tutoring and question explanations", icon: i.chat, span: 8, tall: true },
    { title: "Suggested prompts", note: "Curriculum-aligned study starters", icon: i.bulb, span: 6 },
    { title: "Explain my mistakes", note: "Walk through wrong answers from quizzes", icon: i.spark, span: 6 },
  ],
};
