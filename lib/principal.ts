// Principal portal: navigation + front-end mock data.
// Replace the mock objects with real API data in the backend phase.

export const principalNav = [
  { href: "/principal", label: "Overview", icon: "M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z" },
  { href: "/principal/announcements", label: "Announcements", icon: "M3 11l15-6v14L3 13z M7 13v5h3v-4" },
  { href: "/principal/teachers", label: "Teachers", icon: "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M19 8v6 M16 11h6" },
  { href: "/principal/students", label: "Students", icon: "M2 9l9-5 9 5-9 5z M6 11.5V16c0 1.5 2.2 3 5 3 M19 14v6 M16 17h6" },
  { href: "/principal/talents", label: "Talents", icon: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" },
  { href: "/principal/fees", label: "Student Fees", icon: "M3 6h18v12H3z M3 10h18 M7 15h3" },
  { href: "/principal/ai", label: "AI Assistant", icon: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6" },
];

/** Title block shown in the portal top bar, opposite the profile card. Unlisted routes fall back to the nav label. */
export const principalTitles: Record<string, { eyebrow: string; title: string; description: string }> = {
  "/principal": {
    eyebrow: "Overview",
    title: "Principal Overview",
    description: "Here is what is happening across your school today.",
  },
  "/principal/announcements": {
    eyebrow: "Announcements",
    title: "Institutional Announcements & Circulars",
    description: "Create, manage, and dispatch broadcasts across staff, students, and departments.",
  },
  "/principal/teachers": {
    eyebrow: "Faculty",
    title: "Faculty & Teachers Management",
    description: "Onboard new teachers, assign academic classes, and manage faculty records.",
  },
  "/principal/students": {
    eyebrow: "Students",
    title: "Student Management & Class Directory",
    description: "Inspect student profiles, monitor class rosters, and review student attendance trends.",
  },
  "/principal/fees": {
    eyebrow: "Student Fees",
    title: "Student Fee Management & Defaulter Tracking",
    description: "Track collections, monitor overdue installments, and follow up with defaulters across every class.",
  },
  "/principal/talents": {
    eyebrow: "Talents",
    title: "Talent & Co-Curricular Directory",
    description: "Discover, filter, and track talented students across athletics, arts, and competitive skills.",
  },
};

export const principal = {
  name: "Dr. Sara Ahmed",
  initials: "SA",
  school: "Greenfield Public School",
};

export const kpis = {
  teachers: { total: 30, onDuty: 28, onLeave: 2, trend: 3.4 },
  students: { total: 642, boys: 338, girls: 304, grades: 10, trend: 2.1 },
  attendance: { percent: 94.2, present: 605, total: 642, trend: 1.3 },
  fees: { total: 642, paid: 518, pending: 83, overdue: 41, trend: -4.8 },
};

export const teacherCheckins = {
  present: 26,
  late: 2,
  absent: 0,
  onLeave: 2,
  total: 30,
  feed: [
    { name: "Ali Raza", subject: "Mathematics", time: "07:42 AM", status: "On time" as const },
    { name: "Hina Javed", subject: "English", time: "07:48 AM", status: "On time" as const },
    { name: "Usman Tariq", subject: "Physics", time: "08:14 AM", status: "Late" as const },
    { name: "Fatima Noor", subject: "Urdu", time: "07:51 AM", status: "On time" as const },
    { name: "Bilal Khan", subject: "Computer", time: "08:21 AM", status: "Late" as const },
  ],
};

export const classAttendance = [
  { grade: "Grade 1", percent: 96 },
  { grade: "Grade 2", percent: 94 },
  { grade: "Grade 3", percent: 97 },
  { grade: "Grade 4", percent: 78 },
  { grade: "Grade 5", percent: 92 },
  { grade: "Grade 6", percent: 95 },
  { grade: "Grade 7", percent: 89 },
  { grade: "Grade 8", percent: 76 },
  { grade: "Grade 9", percent: 93 },
  { grade: "Grade 10", percent: 91 },
];

export const LOW_ATTENDANCE = 80;

// Fee status is tracked by student count only (paid vs not paid), never by amount.
export const feeOverview = {
  monthTotal: 642,
  monthPaid: 518,
  aging: [
    { bucket: "30 days", count: 24, tone: "warn" as const },
    { bucket: "60 days", count: 11, tone: "serious" as const },
    { bucket: "90+ days", count: 6, tone: "danger" as const },
  ],
  topPending: [
    { grade: "Grade 9", unpaid: 9, total: 66 },
    { grade: "Grade 7", unpaid: 8, total: 64 },
    { grade: "Grade 10", unpaid: 7, total: 64 },
    { grade: "Grade 4", unpaid: 6, total: 62 },
  ],
};

export type Audience = "Teachers Only" | "Students Only" | "School-Wide";

export const announcements: { title: string; text: string; audience: Audience; when: string }[] = [
  { title: "Mid-term exam schedule released", text: "Exams begin Monday, 26 October. Date sheets are on the student dashboard.", audience: "Students Only", when: "2h ago" },
  { title: "Staff meeting at 2:00 PM", text: "All teachers please join in the conference room to review term progress.", audience: "Teachers Only", when: "5h ago" },
  { title: "School closed on Friday", text: "The campus will remain closed for maintenance. Classes resume Saturday.", audience: "School-Wide", when: "Yesterday" },
  { title: "Fee deadline reminder", text: "October fees are due by the 15th. Late fee applies after the deadline.", audience: "Students Only", when: "2d ago" },
];

export const notifications = [
  { text: "6 students are 90+ days overdue on fees", tone: "danger" as const, when: "10m ago" },
  { text: "Grade 8 attendance fell below 80% today", tone: "warn" as const, when: "35m ago" },
  { text: "2 teachers checked in late this morning", tone: "warn" as const, when: "1h ago" },
];

export const aiSuggestions = ["Who delayed fees this month?", "Show attendance summary for Grade 10", "Register a new teacher"];

// Canned answers for the front-end preview of the AI copilot.
export const aiMockAnswers: Record<string, string> = {
  "Who delayed fees this month?":
    "124 of 642 students have not paid this month. 41 are overdue, and 6 of them are 90+ days late. Grade 9 has the most unpaid students (9 of 66).",
  "Show attendance summary for Grade 10":
    "Grade 10 attendance today is 91% (58 of 64 present). This week's average is 92.4%, slightly above the school average.",
  "Register a new teacher":
    "Sure. Tell me the teacher's full name, email, and subject, and I will create the account after your confirmation.",
};
