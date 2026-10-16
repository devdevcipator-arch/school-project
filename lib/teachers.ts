// Teachers Management: types + front-end mock roster.
// Replace with real API data in the backend phase.

export type TeacherStatus = "active" | "leave" | "inactive";
export type CheckIn = { state: "present" | "late" | "absent" | "leave" | "none"; time?: string };

export type Teacher = {
  id: string;
  name: string;
  empId: string;
  email: string;
  phone: string;
  /** Primary class/section this teacher is class teacher of, e.g. "10-A". */
  classTeacher: string | null;
  /** Grades taught as subject teacher. */
  classes: string[];
  subjects: string[];
  status: TeacherStatus;
  checkIn: CheckIn;
  joined: string;
  /** Joined through an invite link and still waiting for the principal to assign classes and subjects. */
  pending?: boolean;
};

export const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Islamiyat", "Pakistan Studies", "Computer Science", "General Science", "Social Studies", "Art", "Physical Education"];
export const grades = Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`);
export const sections = ["A", "B", "C"];
export const SCHOOL_DOMAIN = "greenfield.edu.pk";

type Row = [name: string, subjects: string[], classTeacher: string | null, classes: number[], status: TeacherStatus, checkIn: string, phone: string, joined: string];

// checkIn: "07:42" present, "L08:14" late, "A" absent, "-" on leave/inactive
const rows: Row[] = [
  ["Ali Raza", ["Mathematics"], "10-A", [9, 10], "active", "07:42", "0300 1234567", "2019-08-01"],
  ["Hina Javed", ["English"], "9-A", [8, 9, 10], "active", "07:48", "0301 2345678", "2020-03-15"],
  ["Usman Tariq", ["Physics"], "10-B", [9, 10], "active", "L08:14", "0302 3456789", "2018-08-20"],
  ["Fatima Noor", ["Urdu"], "8-A", [7, 8], "active", "07:51", "0303 4567890", "2021-01-10"],
  ["Bilal Khan", ["Computer Science"], null, [6, 7, 8, 9, 10], "active", "L08:21", "0304 5678901", "2022-08-01"],
  ["Ayesha Siddiqui", ["Chemistry"], "9-B", [9, 10], "active", "07:39", "0305 6789012", "2017-04-03"],
  ["Hamza Iqbal", ["Biology"], null, [9, 10], "active", "07:55", "0306 7890123", "2023-02-14"],
  ["Sana Malik", ["General Science"], "6-A", [5, 6], "active", "07:44", "0307 8901234", "2020-08-24"],
  ["Imran Shah", ["Pakistan Studies", "Social Studies"], "7-A", [6, 7, 8], "active", "07:50", "0308 9012345", "2016-09-01"],
  ["Zainab Akhtar", ["English"], "5-A", [4, 5], "active", "07:46", "0309 0123456", "2021-08-16"],
  ["Kamran Ali", ["Mathematics"], "8-B", [7, 8], "leave", "-", "0310 1122334", "2019-01-07"],
  ["Mariam Yousaf", ["Islamiyat"], null, [5, 6, 7, 8], "active", "07:58", "0311 2233445", "2022-03-01"],
  ["Saad Ahmed", ["Physical Education"], null, [3, 4, 5, 6, 7, 8, 9, 10], "active", "07:30", "0312 3344556", "2018-02-19"],
  ["Rabia Aslam", ["Art"], null, [1, 2, 3, 4, 5], "active", "07:57", "0313 4455667", "2023-08-07"],
  ["Nadia Hussain", ["English", "Urdu"], "1-A", [1], "active", "07:41", "0314 5566778", "2015-08-10"],
  ["Farah Naz", ["Mathematics", "General Science"], "2-A", [2], "active", "07:47", "0315 6677889", "2019-08-12"],
  ["Sobia Rehman", ["English", "Social Studies"], "3-A", [3], "active", "07:52", "0316 7788990", "2020-01-20"],
  ["Tahir Mehmood", ["Mathematics"], "4-A", [3, 4], "active", "07:43", "0317 8899001", "2017-08-28"],
  ["Asma Jamil", ["Urdu", "Islamiyat"], "1-B", [1, 2], "active", "07:49", "0318 9900112", "2022-01-03"],
  ["Waqas Hassan", ["Physics", "Mathematics"], null, [8, 9], "active", "07:53", "0319 0011223", "2021-09-06"],
  ["Mehwish Tariq", ["Chemistry", "General Science"], "7-B", [6, 7], "leave", "-", "0320 1212121", "2020-10-12"],
  ["Junaid Akram", ["Computer Science"], null, [3, 4, 5], "active", "07:45", "0321 2323232", "2023-01-09"],
  ["Sadia Parveen", ["English"], "6-B", [6, 7], "active", "07:40", "0322 3434343", "2018-08-06"],
  ["Adeel Butt", ["Social Studies", "Pakistan Studies"], "5-B", [5, 9, 10], "active", "07:54", "0323 4545454", "2019-04-22"],
  ["Uzma Khalid", ["Biology", "General Science"], "4-B", [4, 8], "active", "07:56", "0324 5656565", "2016-08-15"],
  ["Shahid Nawaz", ["Urdu"], "10-C", [9, 10], "active", "07:38", "0325 6767676", "2014-08-18"],
  ["Lubna Riaz", ["Mathematics"], "3-B", [2, 3], "active", "07:59", "0326 7878787", "2022-08-22"],
  ["Faisal Qureshi", ["Islamiyat"], null, [9, 10], "active", "07:50", "0327 8989898", "2021-02-01"],
  ["Hira Mansoor", ["English"], "2-B", [1, 2], "active", "07:44", "0328 9090909", "2023-03-13"],
  ["Naveed Anjum", ["Chemistry"], null, [8, 9, 10], "active", "07:47", "0329 1010101", "2017-01-16"],
  ["Rizwan Saeed", ["Physics"], null, [9], "inactive", "-", "0330 2020202", "2015-03-02"],
  ["Samina Gul", ["Art"], null, [6, 7], "inactive", "-", "0331 3030303", "2018-11-05"],
];

function toCheckIn(code: string, status: TeacherStatus): CheckIn {
  if (status === "inactive") return { state: "none" };
  if (status === "leave" || code === "-") return { state: "leave" };
  if (code === "A") return { state: "absent" };
  if (code.startsWith("L")) return { state: "late", time: code.slice(1) };
  return { state: "present", time: code };
}

export function emailFor(name: string) {
  return `${name.toLowerCase().replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, ".")}@${SCHOOL_DOMAIN}`;
}

export const teachers: Teacher[] = rows.map(([name, subs, ct, classes, status, ci, phone, joined], i) => ({
  id: `t${i + 1}`,
  name,
  empId: `TCH-${1001 + i}`,
  email: emailFor(name),
  phone: `+92 ${phone.slice(1)}`,
  classTeacher: ct,
  classes: classes.map((g) => `Grade ${g}`),
  subjects: subs,
  status,
  checkIn: toCheckIn(ci, status),
  joined,
}));

// Teachers who accepted an invite link but have no classes or subjects assigned yet.
const invited: [name: string, phone: string, joined: string][] = [
  ["Hira Mansoor", "+92 321 7788990", "2026-10-12"],
  ["Usman Ghani", "", "2026-10-14"],
  ["Sana Iqbal", "+92 333 2211445", "2026-10-15"],
];

teachers.push(
  ...invited.map(([name, phone, joined], i): Teacher => ({
    id: `t-inv${i + 1}`,
    name,
    empId: `TCH-${1001 + rows.length + i}`,
    email: emailFor(name),
    phone,
    classTeacher: null,
    classes: [],
    subjects: [],
    status: "active",
    checkIn: { state: "none" },
    joined,
    pending: true,
  })),
);

const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-14" to "14 Oct 2026". */
export const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${shortMonths[m - 1]} ${y}`;
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** "07:42" to "07:42 AM". */
export function clock(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Grade number of a class/section like "10-A". */
export const gradeOf = (section: string) => `Grade ${section.split("-")[0]}`;

export function teachesGrade(t: Teacher, grade: string) {
  return t.classes.includes(grade) || (t.classTeacher !== null && gradeOf(t.classTeacher) === grade);
}

export const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const periods = ["08:00", "08:45", "09:30", "10:30", "11:15", "12:00"];

/** Deterministic weekly timetable from a teacher's subjects and classes (mock until the timetable module exists). */
export function weeklySchedule(t: Teacher): (null | { subject: string; cls: string })[][] {
  const cls = t.classTeacher ? [t.classTeacher, ...t.classes.map((g) => `${g.replace("Grade ", "")}-A`).filter((c) => c !== t.classTeacher)] : t.classes.map((g) => `${g.replace("Grade ", "")}-A`);
  const seed = Number(t.id.slice(1));
  return days.map((_, d) =>
    periods.map((_, p) => {
      if ((p + d + seed) % 4 === 3 || !cls.length) return null; // free period
      const k = d * periods.length + p + seed;
      return { subject: t.subjects[k % t.subjects.length], cls: cls[k % cls.length] };
    }),
  );
}
