import { mySections } from "@/lib/classAttendance";
import { respond, suggestions, type Reply, type VaultDoc } from "@/lib/copilot";
import { principal } from "@/lib/principal";
import { sectionLabel } from "@/lib/students";
import { teacher } from "@/lib/teacher";
import { student } from "@/lib/student";
import { respondStudent, studentSuggestions } from "@/lib/studentCopilot";
import { respondTeacher, teacherSuggestions } from "@/lib/teacherCopilot";

export type PersonaKey = "principal" | "teacher" | "student";

/** Everything that differs between the principal's and a teacher's copilot; the UI is shared. */
export type Persona = {
  name: string;
  tagline: string;
  greeting: string;
  placeholder: string;
  suggestions: { group: string; prompts: string[] }[];
  respond: (raw: string, vault: VaultDoc[]) => Reply;
  /** Composer footnote under the input. */
  footnote: string;
  /** Student view: browse the vault only, no uploads. */
  studyOnly?: boolean;
};

export const personas: Record<PersonaKey, Persona> = {
  principal: {
    name: "Executive Copilot",
    tagline: "Queries school data · executes admin actions with your confirmation · cites your vault",
    greeting: `Good day, ${principal.name.split(" ").slice(0, 2).join(" ")}. I have live access to every school record and your knowledge vault. Ask a question, tell me to take an action, or ask about a book or policy.`,
    placeholder: "Ask about any record, say 'Add a teacher...', or ask about a syllabus or policy",
    suggestions,
    respond,
    footnote: "Enter to send · Shift + Enter for a new line · Actions never run without your confirmation",
  },
  teacher: {
    name: "Teaching Copilot",
    tagline: "Queries your classes · drafts quizzes, notices and remarks with your confirmation · cites the vault",
    greeting: `Good day, ${teacher.firstName}. I have live access to your classes (${mySections.map((s) => sectionLabel(s.section)).join(", ")}), your own attendance and the knowledge vault. Ask a question, tell me to draft a quiz, notice or report remark, or ask about a book or policy.`,
    placeholder: "Ask about your classes, say 'Generate a quiz on...', or ask about a syllabus or policy",
    suggestions: teacherSuggestions,
    respond: respondTeacher,
    footnote: "Enter to send · Shift + Enter for a new line · Actions never run without your confirmation",
  },
  student: {
    name: "Study Copilot",
    tagline: "Explains topics · writes practice questions · plans your revision · cites your textbooks",
    greeting: `Hi ${student.firstName}! I am your study assistant for ${student.classLabel}. Ask me to explain a topic, quiz you, plan your revision around upcoming work, or find something in your textbooks. I only help with your courses and studies, not personal information.`,
    placeholder: "Ask about a topic, say 'Quiz me on...', or ask what is due this week",
    suggestions: studentSuggestions,
    respond: respondStudent,
    footnote: "Enter to send · Shift + Enter for a new line · Study questions only: no personal data",
    studyOnly: true,
  },
};
