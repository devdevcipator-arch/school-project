// Principal portal: navigation + front-end mock data.
// Replace the mock objects with real API data in the backend phase.

export const principalNav = [
  { href: "/principal", label: "Overview", icon: "M4 4h7v7H4z M13 4h7v4h-7z M13 10h7v10h-7z M4 13h7v7H4z" },
  { href: "/principal/announcements", label: "Announcements", icon: "M3 11l15-6v14L3 13z M7 13v5h3v-4" },
  { href: "/principal/teachers", label: "Add Teachers", icon: "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M19 8v6 M16 11h6" },
  { href: "/principal/schools", label: "Add Schools", icon: "M3 21h18 M5 21V10l7-5 7 5v11 M10 21v-5h4v5 M12 9v2" },
  { href: "/principal/teacher-attendance", label: "Teacher Attendance", icon: "M8 3v3 M16 3v3 M4 7h16v13H4z M8 14l2.5 2.5L16 11" },
  { href: "/principal/student-attendance", label: "Student Attendance", icon: "M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" },
  { href: "/principal/fees", label: "Student Fees", icon: "M3 6h18v12H3z M3 10h18 M7 15h3" },
  { href: "/principal/ai", label: "AI Assistant", icon: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6" },
];

export const principal = {
  name: "Dr. Sara Ahmed",
  initials: "SA",
  school: "Greenfield Public School",
  campuses: ["Main Campus", "City Branch", "Model Town Branch"],
  term: "Fall Term 2026",
};

export const kpis = {
  teachers: { total: 30, onDuty: 28, onLeave: 2, trend: 3.4 },
  students: { total: 642, boys: 338, girls: 304, grades: 10, trend: 2.1 },
  attendance: { percent: 94.2, present: 605, total: 642, trend: 1.3 },
  fees: { expected: 3_210_000, collected: 2_486_000, overdue: 412_000, trend: -4.8 },
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

export const feeOverview = {
  monthTarget: 1_070_000,
  monthCollected: 812_000,
  aging: [
    { bucket: "30 days", count: 24, amount: 186_000, tone: "warn" as const },
    { bucket: "60 days", count: 11, amount: 132_000, tone: "serious" as const },
    { bucket: "90+ days", count: 6, amount: 94_000, tone: "danger" as const },
  ],
  topPending: [
    { grade: "Grade 9", students: 9, amount: 96_500 },
    { grade: "Grade 7", students: 8, amount: 81_000 },
    { grade: "Grade 10", students: 7, amount: 78_000 },
    { grade: "Grade 4", students: 6, amount: 52_500 },
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
    "41 students have pending fees this month. 6 are 90+ days overdue (Rs 94,000). Highest pending class: Grade 9, with 9 students owing Rs 96,500.",
  "Show attendance summary for Grade 10":
    "Grade 10 attendance today is 91% (58 of 64 present). This week's average is 92.4%, slightly above the school average.",
  "Register a new teacher":
    "Sure. Tell me the teacher's full name, email, subject and campus, and I will create the account after your confirmation.",
};

export function formatRs(n: number) {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `Rs ${Math.round(n / 1_000)}K`;
  return `Rs ${n}`;
}
