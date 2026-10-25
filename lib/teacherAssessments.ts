import { me } from "@/lib/myAttendance";
import { studentAssessments, studentRecord, type Assessment } from "@/lib/student";

/** The same record the student portal shows, plus the class it was set for. */
export type ClassAssessment = Assessment & { section: string };

export const teacherName = `Mr. ${me.name}`;

// Grade 10-A is the student portal's class, so its work here is the exact list the student sees.
export const teacherAssessments: ClassAssessment[] = [
  ...studentAssessments.filter((a) => a.teacher === teacherName).map((a) => ({ ...a, section: studentRecord.section })),
  { id: "AS-123", section: "9-B", title: "Quadratic Equations Quiz", subject: "Mathematics", kind: "Quiz", teacher: teacherName, assigned: "2026-10-19", due: "2026-10-22", details: "Factorisation and the quadratic formula. 15 questions, 25 minutes." },
  { id: "AS-124", section: "9-B", title: "Sets and Functions Homework", subject: "Mathematics", kind: "Homework", teacher: teacherName, assigned: "2026-10-21", due: "2026-10-27", details: "Exercise 2.3, questions 1 to 10. Draw Venn diagrams neatly." },
  { id: "AS-125", section: "8-A", title: "Fractions and Decimals Test", subject: "Mathematics", kind: "Test", teacher: teacherName, assigned: "2026-10-15", due: "2026-10-30", extendedFrom: "2026-10-24", details: "Units 1 and 2. Bring a geometry box. No calculators." },
  { id: "AS-111", section: "8-A", title: "Ratio Worksheet", subject: "Mathematics", kind: "Homework", teacher: teacherName, assigned: "2026-10-08", due: "2026-10-13", details: "Both sides of the worksheet handed out in class." },
];
