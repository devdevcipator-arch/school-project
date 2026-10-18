// Resource Hub & Digital Library: folder tree, documents and helpers.
// Deterministic mock library; uploads live in memory (object URLs) until the backend phase.

import { hash } from "./students";
import { teachers } from "./teachers";

export type Role = "teacher" | "student";
export type Ext = "pdf" | "docx" | "pptx" | "epub";
export type Category = "textbook" | "helping" | "past-paper" | "presentation" | "worksheet";
export type TypeFilter = "all" | "textbooks" | "worksheets" | "slides" | "past-papers";

export type Folder = { id: string; name: string; parentId: string | null; grade: number | null; subject: string | null; updated: string };

export type Resource = {
  id: string;
  title: string;
  description: string;
  ext: Ext;
  size: number;
  grade: number;
  subject: string;
  category: Category;
  folderId: string;
  uploadedBy: string;
  uploadedAt: string;
  /** Object URL for files uploaded in this session. */
  url?: string;
};

/** Upload form labels and the badge shown on each file. */
export const categoryMeta: Record<Category, { upload: string; badge: string }> = {
  textbook: { upload: "Curriculum Textbook", badge: "Official Textbook" },
  helping: { upload: "Helping Book / Notes", badge: "Reference Guide" },
  "past-paper": { upload: "Past Papers", badge: "Question Bank" },
  presentation: { upload: "Class Presentation", badge: "Lecture Slides" },
  worksheet: { upload: "Worksheet", badge: "Worksheet" },
};

export const typeFilters: { key: TypeFilter; label: string; match: Category[] }[] = [
  { key: "all", label: "All Types", match: [] },
  { key: "textbooks", label: "Textbooks / PDFs", match: ["textbook", "helping"] },
  { key: "worksheets", label: "Worksheets", match: ["worksheet"] },
  { key: "slides", label: "Slides / PPTX", match: ["presentation"] },
  { key: "past-papers", label: "Past Papers", match: ["past-paper"] },
];

export const STORAGE_LIMIT = 20 * 1024 ** 3;
export const MAX_UPLOAD = 50 * 1024 ** 2;
export const allowedExt: Ext[] = ["pdf", "epub", "docx", "pptx"];

export const subjectsForGrade = (g: number) =>
  g <= 5 ? ["English", "Urdu", "Mathematics", "General Science"] : g <= 8 ? ["English", "Urdu", "Mathematics", "General Science", "Computer Science"] : ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Computer Science"];

/** Subject accent for folder icons and pills, drawn from the brand palette. */
export const subjectAccent = (subject: string | null) => {
  const map: Record<string, string> = {
    Mathematics: "bg-primary text-surface",
    Physics: "bg-accent text-white",
    Chemistry: "bg-[#3d6e71] text-white",
    Biology: "bg-ok text-white",
    English: "bg-ink text-surface",
    Urdu: "bg-[#0b2a38] text-surface",
    "General Science": "bg-[#2f7a76] text-white",
    "Computer Science": "bg-[#14445a] text-surface",
  };
  return (subject && map[subject]) || "bg-linear-135 from-primary to-accent text-surface";
};

const topics: Record<string, string[]> = {
  Mathematics: ["Quadratic Equations", "Trigonometry", "Matrices", "Linear Graphs", "Fractions", "Sets and Functions"],
  Physics: ["Thermodynamics", "Optics", "Kinematics", "Electricity", "Waves and Sound"],
  Chemistry: ["Chemical Bonding", "Periodic Table", "Organic Chemistry", "Acids and Bases"],
  Biology: ["Cell Biology", "Photosynthesis", "Human Digestion", "Genetics"],
  English: ["Essay Writing", "Grammar and Tenses", "Comprehension", "Poetry Analysis"],
  Urdu: ["Insha Pardazi", "Nazm Tashreeh", "Qawaid", "Khulasa Navesi"],
  "General Science": ["Water Cycle", "Plants and Animals", "Matter", "Energy"],
  "Computer Science": ["Programming Basics", "Networks", "Algorithms", "Databases"],
};

const short = (s: string) => (s === "Mathematics" ? "Maths" : s === "Computer Science" ? "CS" : s === "General Science" ? "Science" : s);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");
const uploaders = teachers.filter((t) => !t.pending).map((t) => t.name);

function fileRows(g: number, subject: string, cat: Category, n: number): { title: string; ext: Ext; description: string }[] {
  const t = topics[subject] ?? ["General"];
  const pick = (i: number) => t[i % t.length];
  switch (cat) {
    case "textbook":
      return [{ title: `PTB ${subject} Grade ${g} Textbook`, ext: "pdf", description: `Punjab Textbook Board ${subject} textbook for Grade ${g}, full syllabus.` }, ...(n > 1 ? [{ title: `${subject} Grade ${g} eBook Edition`, ext: "epub" as Ext, description: "Reflowable eBook version for phones and tablets." }] : [])];
    case "helping":
      return Array.from({ length: n }, (_, i) => ({ title: i % 2 ? `${short(subject)} Notes - ${pick(i)}` : `PTB ${short(subject)} Keybook - Chapter ${i + 3}`, ext: (i % 2 ? "docx" : "pdf") as Ext, description: i % 2 ? `Teacher-written notes on ${pick(i)}.` : "Solved exercises and key points for the chapter." }));
    case "past-paper":
      return Array.from({ length: n }, (_, i) => ({ title: `BISE Lahore ${short(subject)} Paper ${2025 - i}`, ext: "pdf" as Ext, description: `Annual board examination paper ${2025 - i} with marking scheme.` }));
    case "presentation":
      return Array.from({ length: n }, (_, i) => ({ title: `${pick(i + 1)} Lecture Slides`, ext: "pptx" as Ext, description: `Classroom slides for ${pick(i + 1)}.` }));
    default:
      return Array.from({ length: n }, (_, i) => ({ title: `${pick(i + 2)} Worksheet`, ext: "docx" as Ext, description: `Practice worksheet on ${pick(i + 2)}.` }));
  }
}

const daysAgo = (now: number, d: number) => new Date(now - d * 86_400_000).toISOString();

/** Grade 1-10 class folders, subject folders inside, and category folders for the senior grades. */
export function seedLibrary(now: number): { folders: Folder[]; files: Resource[] } {
  const folders: Folder[] = [];
  const files: Resource[] = [];
  let seq = 0;
  for (let g = 10; g >= 1; g--) {
    const gid = `g${g}`;
    folders.push({ id: gid, name: `Grade ${g}`, parentId: null, grade: g, subject: null, updated: daysAgo(now, 1 + (g % 6)) });
    const subjects = subjectsForGrade(g).slice(0, g >= 8 ? 6 : g >= 4 ? 3 : 2);
    for (const subject of subjects) {
      const sid = `${gid}-${slug(subject)}`;
      folders.push({ id: sid, name: subject, parentId: gid, grade: g, subject, updated: daysAgo(now, 2 + ((g + subject.length) % 12)) });
      const senior = g >= 8;
      const plan: [Category, string, number][] = senior
        ? [
            ["textbook", "Textbooks", g === 10 && subject === "Mathematics" ? 2 : 1],
            ["helping", "Helping Books", 2 + (subject.length % 3)],
            ["past-paper", "Past Papers", g >= 9 ? 2 + (subject.length % 2) : 0],
            ["presentation", "Slides & Worksheets", 1],
            ["worksheet", "Slides & Worksheets", 1],
          ]
        : [
            ["textbook", "", 1],
            ["worksheet", "", 1],
          ];
      for (const [cat, sub, n] of plan) {
        if (!n) continue;
        let folderId = sid;
        if (sub) {
          folderId = `${sid}-${slug(sub)}`;
          if (!folders.some((f) => f.id === folderId)) folders.push({ id: folderId, name: sub, parentId: sid, grade: g, subject, updated: daysAgo(now, 1 + ((g * 3 + sub.length) % 15)) });
        }
        for (const row of fileRows(g, subject, cat, n)) {
          seq++;
          const r = hash(seq, 77);
          files.push({
            id: `r${seq}`,
            ...row,
            title: `${row.title}.${row.ext}`,
            size: Math.round((cat === "textbook" ? 12 + r * 30 : cat === "presentation" ? 4 + r * 14 : 0.3 + r * 3.5) * 1024 ** 2),
            grade: g,
            subject,
            category: cat,
            folderId,
            uploadedBy: uploaders[Math.floor(hash(seq, 78) * uploaders.length)],
            // A handful of files are fresh this week; the rest spread over the term.
            uploadedAt: daysAgo(now, seq % 23 === 0 ? 1 + (seq % 5) : 8 + Math.floor(r * 70)),
          });
        }
      }
    }
  }
  return { folders, files };
}

export const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

export function formatSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function ago(iso: string, now: number) {
  const d = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${d < 14 ? "" : "s"} ago`;
  return `${Math.floor(d / 30)} month${d < 60 ? "" : "s"} ago`;
}

/** Ids of a folder and everything below it. */
export function subtree(folders: Folder[], id: string) {
  const out = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      if (f.parentId && out.has(f.parentId) && !out.has(f.id)) {
        out.add(f.id);
        grew = true;
      }
    }
  }
  return out;
}

export function pathOf(folders: Folder[], id: string | null): Folder[] {
  const out: Folder[] = [];
  for (let f = folders.find((x) => x.id === id); f; f = folders.find((x) => x.id === f!.parentId)) out.unshift(f);
  return out;
}

/** Minimal one-page PDF so mock library files download as real documents. */
export function placeholderPdf(title: string, lines: string[]) {
  const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\x7e]/g, "-");
  const text = [`BT /F1 20 Tf 60 760 Td (${esc(title)}) Tj ET`, ...lines.map((l, i) => `BT /F1 12 Tf 60 ${720 - i * 22} Td (${esc(l)}) Tj ET`)].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
