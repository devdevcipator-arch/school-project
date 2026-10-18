import { mySections } from "@/lib/classAttendance";
import { respond, seedAudit, suggestions, type AuditEntry, type AuditKind, type Reply, type VaultDoc } from "@/lib/copilot";
import { principal } from "@/lib/principal";
import { sectionLabel } from "@/lib/students";
import { teacher } from "@/lib/teacher";
import { respondTeacher, teacherAudit, teacherSuggestions } from "@/lib/teacherCopilot";

export type PersonaKey = "principal" | "teacher";

/** Everything that differs between the principal's and a teacher's copilot; the UI is shared. */
export type Persona = {
  owner: string;
  name: string;
  tagline: string;
  access: string;
  greeting: string;
  placeholder: string;
  suggestions: { group: string; prompts: string[] }[];
  respond: (raw: string, vault: VaultDoc[]) => Reply;
  audit: AuditEntry[];
  auditKinds: AuditKind[];
};

export const personas: Record<PersonaKey, Persona> = {
  principal: {
    owner: principal.name,
    name: "Executive Copilot",
    tagline: "Queries school data · executes admin actions with your confirmation · cites your vault",
    access: "Full Administrative Access · RBAC Level 0",
    greeting: `Good day, ${principal.name.split(" ").slice(0, 2).join(" ")}. I have live access to every school record and your knowledge vault. Ask a question, tell me to take an action, or ask about a book or policy.`,
    placeholder: "Ask about any record, say 'Add a teacher...', or ask about a syllabus or policy",
    suggestions,
    respond,
    audit: seedAudit,
    auditKinds: ["teacher", "student", "announcement", "vault", "session"],
  },
  teacher: {
    owner: teacher.name,
    name: "Teaching Copilot",
    tagline: "Queries your classes · drafts quizzes, notices and remarks with your confirmation · cites the vault",
    access: `Class Teacher Access · RBAC Level 2 · ${mySections.map((s) => s.section).join(", ")}`,
    greeting: `Good day, ${teacher.firstName}. I have live access to your classes (${mySections.map((s) => sectionLabel(s.section)).join(", ")}), your own attendance and the knowledge vault. Ask a question, tell me to draft a quiz, notice or report remark, or ask about a book or policy.`,
    placeholder: "Ask about your classes, say 'Generate a quiz on...', or ask about a syllabus or policy",
    suggestions: teacherSuggestions,
    respond: respondTeacher,
    audit: teacherAudit,
    auditKinds: ["assessment", "announcement", "report", "vault", "session"],
  },
};
