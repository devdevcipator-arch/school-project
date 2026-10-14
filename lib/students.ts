// Student directory: types, deterministic mock roster and attendance records.
// Replace with real API data in the backend phase.

import { teachers } from "./teachers";

export type DayStatus = "present" | "absent" | "leave";

export type DayLog = {
  /** ISO date, e.g. "2026-10-13". */
  date: string;
  status: DayStatus;
  remark?: string;
};

export type Student = {
  id: string;
  name: string;
  gender: "Male" | "Female";
  /** Class/section, e.g. "10-A". */
  section: string;
  rollNo: number;
  regId: string;
  guardian: string;
  guardianRelation: "Father" | "Mother" | "Guardian";
  phone: string;
  email: string;
  dob: string;
  address: string;
  enrolled: string;
  today: DayStatus;
  /** Current-term attendance, 0-100 with one decimal. */
  termRate: number;
  term: Record<DayStatus, number>;
  /** Per-student seed for the attendance generator. */
  seed: number;
  /** Chance of missing any given day. */
  missRate: number;
};

/** Mock snapshot date: rosters and logs are generated up to this day. */
export const AS_OF = "2026-10-13";
export const TERM_START = "2026-08-03";
export const TERM_LABEL = "Autumn term 2026";
export const DEFAULTER_BELOW = 75;

const boys = ["Ahmed", "Ali", "Hassan", "Hamza", "Usman", "Bilal", "Zain", "Saad", "Abdullah", "Ibrahim", "Musa", "Rayan", "Arham", "Haris", "Talha", "Fahad", "Umar", "Danish", "Shayan", "Muneeb", "Areeb", "Huzaifa", "Rehan", "Ayaan"];
const girls = ["Ayesha", "Fatima", "Zainab", "Maryam", "Hira", "Amna", "Eman", "Aleena", "Hania", "Iqra", "Laiba", "Mahnoor", "Noor", "Rida", "Sana", "Anaya", "Zoya", "Alishba", "Areesha", "Inaya", "Khadija", "Manahil", "Hafsa", "Sidra"];
const fathers = ["Imran", "Tariq", "Khalid", "Asif", "Naveed", "Shahid", "Rashid", "Javed", "Kashif", "Farooq", "Nadeem", "Sajid", "Waseem", "Zahid", "Amir", "Arshad"];
const surnames = ["Khan", "Ahmed", "Malik", "Butt", "Sheikh", "Qureshi", "Chaudhry", "Raza", "Iqbal", "Hussain", "Siddiqui", "Aslam", "Mirza", "Abbasi", "Javed", "Rana"];
const areas = ["Model Town", "Johar Town", "Gulberg III", "DHA Phase 5", "Faisal Town", "Garden Town", "Wapda Town", "Township", "Iqbal Town", "Cantt"];
const leaveRemarks = ["Medical leave", "Family event", "Approved leave", "Travelling with family"];
const absentRemarks = ["Unexcused absence", "Absent, guardian informed", "Unexcused absence"];

/** Every class/section that has a class teacher, e.g. "1-A" ... "10-C". */
export const sections = teachers
  .map((t) => t.classTeacher)
  .filter((s): s is string => s !== null)
  .sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b));

export const classTeacherOf = (section: string) => teachers.find((t) => t.classTeacher === section)?.name ?? "Not assigned";
export const gradeNum = (section: string) => parseInt(section);

export function subjectsFor(s: Student) {
  const g = gradeNum(s.section);
  if (g <= 3) return ["English", "Urdu", "Mathematics", "General Science", "Islamiyat", "Art"];
  if (g <= 8) return ["English", "Urdu", "Mathematics", "General Science", "Islamiyat", "Social Studies", "Computer Science"];
  return ["English", "Urdu", "Mathematics", "Physics", "Chemistry", s.seed % 2 ? "Biology" : "Computer Science", "Islamiyat", "Pakistan Studies"];
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const DAY = 86_400_000;
const toDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / DAY;
const fromDay = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);

/** Stateless hash to [0, 1): the same student + day always gets the same value. */
export function hash(a: number, b: number) {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Weekends, summer break (Jun-Jul) and winter break (22-31 Dec) are not school days. */
export function isSchoolDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const wd = d.getUTCDay();
  const m = d.getUTCMonth();
  return wd !== 0 && wd !== 6 && m !== 5 && m !== 6 && !(m === 11 && d.getUTCDate() >= 22);
}

function dayLog(seed: number, missRate: number, date: string): DayLog {
  const r = hash(seed, toDay(date));
  if (r >= missRate) return { date, status: "present" };
  const pick = hash(seed + 1, toDay(date));
  // Roughly 40% of missed days are approved leave, the rest absences.
  return r < missRate * 0.4
    ? { date, status: "leave", remark: leaveRemarks[Math.floor(pick * leaveRemarks.length)] }
    : { date, status: "absent", remark: absentRemarks[Math.floor(pick * absentRemarks.length)] };
}

/** School-day logs between two dates (inclusive), oldest first. */
export function attendanceLogs(s: Pick<Student, "seed" | "missRate">, from: string, to = AS_OF): DayLog[] {
  const out: DayLog[] = [];
  for (let n = toDay(from), end = toDay(to); n <= end; n++) {
    const date = fromDay(n);
    if (isSchoolDay(date)) out.push(dayLog(s.seed, s.missRate, date));
  }
  return out;
}

export function tally(logs: DayLog[]) {
  const t: Record<DayStatus, number> = { present: 0, absent: 0, leave: 0 };
  for (const l of logs) t[l.status]++;
  const total = logs.length;
  return { ...t, total, rate: total ? Math.round((t.present / total) * 1000) / 10 : 0 };
}

function build(): Student[] {
  const out: Student[] = [];
  let i = 0;
  sections.forEach((section, si) => {
    const grade = gradeNum(section);
    // 642 students over 21 sections: the first 12 sections get 31, the rest 30.
    const size = si < 12 ? 31 : 30;
    const batch: Omit<Student, "rollNo" | "regId" | "id">[] = [];
    for (let k = 0; k < size; k++, i++) {
      const seed = i + 1;
      const r = (n: number) => hash(seed * 31 + n, 7);
      // A coprime step spreads exactly 338 boys over the 642 seats.
      const male = (i * 7919) % 642 < 338;
      const first = male ? boys[Math.floor(r(1) * boys.length)] : girls[Math.floor(r(1) * girls.length)];
      const surname = surnames[Math.floor(r(2) * surnames.length)];
      const father = `${fathers[Math.floor(r(3) * fathers.length)]} ${surname}`;
      const relation = r(4) < 0.86 ? "Father" : r(4) < 0.95 ? "Mother" : "Guardian";
      const guardian = relation === "Father" ? father : relation === "Mother" ? `${girls[Math.floor(r(5) * girls.length)]} ${surname}` : `${fathers[Math.floor(r(5) * fathers.length)]} ${surnames[Math.floor(r(6) * surnames.length)]}`;
      const yearsIn = Math.floor(r(7) * grade);
      const enrolled = `${2026 - yearsIn}-04-${pad(1 + Math.floor(r(8) * 10))}`;
      const dob = `${2026 - grade - 5 - (r(9) < 0.3 ? 1 : 0)}-${pad(1 + Math.floor(r(10) * 12))}-${pad(1 + Math.floor(r(11) * 28))}`;
      // About 4% of students are chronic absentees; the rest miss 1-7% of days.
      const missRate = r(12) < 0.04 ? 0.27 + r(13) * 0.12 : 0.01 + r(13) * 0.06;
      const term = tally(attendanceLogs({ seed, missRate }, TERM_START));
      batch.push({
        name: `${first} ${surname}`,
        gender: male ? "Male" : "Female",
        section,
        guardian,
        guardianRelation: relation,
        phone: `+92 3${pad(Math.floor(r(14) * 50), 2)} ${pad(Math.floor(r(15) * 10_000_000), 7)}`,
        email: `${guardian.toLowerCase().replace(/\s+/g, ".")}${Math.floor(r(16) * 90) + 10}@gmail.com`,
        dob,
        address: `House ${1 + Math.floor(r(17) * 240)}, Street ${1 + Math.floor(r(18) * 30)}, ${areas[Math.floor(r(19) * areas.length)]}, Lahore`,
        enrolled,
        today: dayLog(seed, missRate, AS_OF).status,
        termRate: term.rate,
        term: { present: term.present, absent: term.absent, leave: term.leave },
        seed,
        missRate,
      });
    }
    batch
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((s, k) => out.push({ ...s, id: `s${s.seed}`, rollNo: k + 1, regId: `GPS-${s.enrolled.slice(0, 4)}-${pad(s.seed, 4)}` }));
  });
  return out;
}

export const students = build();

/** "10-A" to "Grade 10-A". */
export const sectionLabel = (section: string) => `Grade ${section}`;
