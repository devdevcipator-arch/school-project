// Announcements & Circulars: types + front-end mock data.
// Replace the mock list with real API data in the backend phase.

export type AudienceKey = "school" | "staff" | "students" | "classes" | "department";
export type Priority = "normal" | "important" | "urgent";
export type NoticeStatus = "published" | "scheduled" | "draft";
export type Channel = "feed" | "banner" | "sms";

export const categories = [
  "Emergency Alert",
  "Holiday / Closure",
  "Exam / Academic",
  "Administrative / HR",
  "Event / Sports",
  "General Notice",
] as const;
export type Category = (typeof categories)[number];

export const grades = Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`);
export const departments = ["Science", "Mathematics", "Humanities", "Languages", "Computer Science", "Sports", "Administrative Staff"];

export const audiences: { key: AudienceKey; label: string; short: string; hint: string }[] = [
  { key: "school", label: "School-Wide", short: "All School", hint: "All teachers and students" },
  { key: "staff", label: "Teachers / Staff Only", short: "Staff Only", hint: "Internal faculty notice" },
  { key: "students", label: "Students Only", short: "Students Only", hint: "Students and parents" },
  { key: "classes", label: "Specific Classes", short: "Classes", hint: "Pick grade levels" },
  { key: "department", label: "Department-Specific", short: "Department", hint: "Pick teacher departments" },
];

export const priorities: { key: Priority; label: string; hint: string }[] = [
  { key: "normal", label: "Normal", hint: "Standard feed entry" },
  { key: "important", label: "Important", hint: "Highlighted with a yellow badge" },
  { key: "urgent", label: "Urgent / Critical", hint: "Red badge + sticky banner" },
];

export const channels: { key: Channel; label: string }[] = [
  { key: "feed", label: "Portal Feed" },
  { key: "banner", label: "Sticky Banner on Login" },
  { key: "sms", label: "Direct SMS / Email Notification" },
];

export type Attachment = { name: string; size: number };

export type Notice = {
  id: string;
  title: string;
  /** Rich-text HTML authored in the composer. */
  body: string;
  audience: AudienceKey;
  /** Grades or departments when the audience is "classes" or "department". */
  targets: string[];
  category: Category;
  priority: Priority;
  status: NoticeStatus;
  /** ISO date-time: publish time, scheduled time, or last edit for drafts. */
  date: string;
  author: string;
  attachments: Attachment[];
  channels: Channel[];
  reads: { read: number; total: number };
  pinned: boolean;
};

/** Read-receipt unit per audience, so staff notices count teachers and others count students. */
export function readUnit(a: AudienceKey) {
  return a === "staff" || a === "department" ? "Teachers" : a === "school" ? "Recipients" : "Students";
}

export const notices: Notice[] = [
  {
    id: "n1",
    title: "Rain emergency: early dismissal at 12:00 PM today",
    body: "<p>Due to heavy rain warnings, <strong>school will dismiss at 12:00 PM</strong>. Parents please arrange early pickup.</p><ul><li>Buses leave at 12:15 PM</li><li>Afternoon tests are postponed</li></ul>",
    audience: "school",
    targets: [],
    category: "Emergency Alert",
    priority: "urgent",
    status: "published",
    date: "2026-10-13T08:05:00",
    author: "Principal Office",
    attachments: [],
    channels: ["feed", "banner", "sms"],
    reads: { read: 588, total: 672 },
    pinned: true,
  },
  {
    id: "n2",
    title: "Mid-term exam datesheet released",
    body: "<p>Mid-term exams begin <strong>Monday, 26 October</strong>. The full datesheet is attached. Students must reach the hall 15 minutes early.</p>",
    audience: "students",
    targets: [],
    category: "Exam / Academic",
    priority: "important",
    status: "published",
    date: "2026-10-12T10:30:00",
    author: "Principal Office",
    attachments: [{ name: "Midterm-Datesheet-2026.pdf", size: 412_000 }],
    channels: ["feed", "sms"],
    reads: { read: 571, total: 642 },
    pinned: false,
  },
  {
    id: "n3",
    title: "Staff meeting: term progress review at 2:00 PM",
    body: "<p>All teachers please join in the conference room. Bring your class progress sheets.</p>",
    audience: "staff",
    targets: [],
    category: "Administrative / HR",
    priority: "normal",
    status: "published",
    date: "2026-10-12T07:45:00",
    author: "Principal Office",
    attachments: [],
    channels: ["feed"],
    reads: { read: 24, total: 30 },
    pinned: false,
  },
  {
    id: "n4",
    title: "Grade 9 & 10 board exam registration deadline",
    body: "<p>Board registration forms must be submitted by <strong>20 October</strong>. Class teachers will collect the forms.</p>",
    audience: "classes",
    targets: ["Grade 9", "Grade 10"],
    category: "Exam / Academic",
    priority: "important",
    status: "published",
    date: "2026-10-10T09:00:00",
    author: "Principal Office",
    attachments: [{ name: "Board-Registration-Form.pdf", size: 238_000 }],
    channels: ["feed", "sms"],
    reads: { read: 112, total: 130 },
    pinned: false,
  },
  {
    id: "n5",
    title: "Science faculty: lab safety guidelines update",
    body: "<p>Updated lab safety guidelines are attached. Please brief your classes before the next practical.</p>",
    audience: "department",
    targets: ["Science"],
    category: "Administrative / HR",
    priority: "normal",
    status: "published",
    date: "2026-10-08T11:20:00",
    author: "Principal Office",
    attachments: [{ name: "Lab-Safety-v3.pdf", size: 1_240_000 }],
    channels: ["feed"],
    reads: { read: 5, total: 6 },
    pinned: false,
  },
  {
    id: "n6",
    title: "Annual Sports Day on 5 November",
    body: "<p>Sports Day will be held on the main ground. Trials for track events start next week.</p>",
    audience: "school",
    targets: [],
    category: "Event / Sports",
    priority: "normal",
    status: "scheduled",
    date: "2026-10-16T08:00:00",
    author: "Principal Office",
    attachments: [],
    channels: ["feed", "sms"],
    reads: { read: 0, total: 672 },
    pinned: false,
  },
  {
    id: "n7",
    title: "October fee deadline reminder",
    body: "<p>October fees are due by the <strong>15th</strong>. Please clear dues to avoid the late list.</p>",
    audience: "students",
    targets: [],
    category: "General Notice",
    priority: "normal",
    status: "published",
    date: "2026-10-05T09:10:00",
    author: "Principal Office",
    attachments: [],
    channels: ["feed", "sms"],
    reads: { read: 498, total: 642 },
    pinned: false,
  },
  {
    id: "n8",
    title: "Exam invigilation duty roster",
    body: "<p>Draft roster for mid-term invigilation. Finalise after HOD review.</p>",
    audience: "staff",
    targets: [],
    category: "Exam / Academic",
    priority: "normal",
    status: "draft",
    date: "2026-10-11T16:40:00",
    author: "Principal Office",
    attachments: [{ name: "Invigilation-Roster.pdf", size: 96_000 }],
    channels: ["feed"],
    reads: { read: 0, total: 30 },
    pinned: false,
  },
  {
    id: "n9",
    title: "Winter uniform from 1 November",
    body: "<p>Students switch to winter uniform from <strong>1 November</strong>. Navy sweaters and blazers only.</p>",
    audience: "students",
    targets: [],
    category: "General Notice",
    priority: "normal",
    status: "published",
    date: "2026-09-28T12:00:00",
    author: "Principal Office",
    attachments: [],
    channels: ["feed"],
    reads: { read: 615, total: 642 },
    pinned: false,
  },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Locale-independent date format so server and client render the same text. */
export function formatDate(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

export function formatSize(bytes: number) {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1_000))} KB`;
}

const SAFE_TAGS = new Set(["p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u", "h3", "h4"]);

/** Keeps only the composer's formatting tags, without attributes, before rendering rich text to readers. */
export function safeHtml(html: string) {
  return html.replace(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi, (_, slash: string, tag: string) => (SAFE_TAGS.has(tag.toLowerCase()) ? `<${slash}${tag.toLowerCase()}>` : ""));
}

export function plainText(html: string) {
  // Block ends become spaces; inline tags vanish so "<b>PM</b>." stays "PM.".
  return html
    .replace(/<\/(p|li|div|h\d)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
