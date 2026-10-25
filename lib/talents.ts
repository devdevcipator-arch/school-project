// Student talent & co-curricular directory: honor levels, a starter catalog of
// categories/skills and a deterministic mock roster built on top of the student directory.
// Categories and skills are free text: the principal can type any new one, and every
// filter is derived from the records. The catalog below only seeds data and suggestions.
// Replace with real API data in the backend phase.

import { AS_OF, gradeNum, hash, students, type Student } from "./students";

type CategoryKey = "sports" | "debate" | "arts" | "writing" | "stem";

/** Starter categories (suggestions + seed data). Talents store the category label. */
export const categories: { key: CategoryKey; label: string; short: string; icon: string }[] = [
  { key: "sports", label: "Sports & Athletics", short: "Sports", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9 M12 3C9.5 5.5 8.5 8.5 8.5 12s1 6.5 3.5 9 M3.5 9h17 M3.5 15h17" },
  { key: "debate", label: "Debate & Public Speaking", short: "Debate", icon: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3 M8 21h8" },
  { key: "arts", label: "Performing Arts & Music", short: "Arts", icon: "M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0a3 3 0 1 1 6 0z M21 16a3 3 0 1 1-6 0a3 3 0 1 1 6 0z" },
  { key: "writing", label: "Creative Writing", short: "Writing", icon: "M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" },
  { key: "stem", label: "STEM & Robotics", short: "STEM", icon: "M9 3h6 M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3 M7.5 15h9" },
];

const labelOf = (key: CategoryKey) => categories.find((c) => c.key === key)!.label;

export const SPORTS = labelOf("sports");
export const DEBATE = labelOf("debate");

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Icon for a category label; custom categories get a star. */
export const categoryIcon = (label: string) =>
  categories.find((c) => sameText(c.label, label))?.icon ?? "M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z";

/** Tidies typed text and reuses the casing of an existing entry, so "cricket" joins "Cricket". */
export function canonical(input: string, existing: string[]) {
  const clean = input.trim().replace(/\s+/g, " ");
  return existing.find((e) => sameText(e, clean)) ?? clean;
}

export type Skill = {
  name: string;
  category: CategoryKey;
  /** Positions / specialisations shown on the primary talent tag. */
  roles: string[];
  /** Flagship competition used for achievements and history. */
  event: string;
  minGrade: number;
};

export const skills: Skill[] = [
  { name: "Cricket", category: "sports", roles: ["Captain", "Fast Bowler", "Opening Batter", "Wicketkeeper", "Spin Bowler", "All-rounder"], event: "Interschool Cricket Cup", minGrade: 4 },
  { name: "Football", category: "sports", roles: ["Striker", "Goalkeeper", "Midfielder", "Defender", "Captain"], event: "Interschool Football League", minGrade: 4 },
  { name: "Athletics", category: "sports", roles: ["100m Sprinter", "Long Jump", "Relay Anchor", "800m Runner", "High Jump"], event: "Interschool Athletics Meet", minGrade: 3 },
  { name: "Badminton", category: "sports", roles: ["Singles", "Doubles"], event: "Junior Badminton Open", minGrade: 5 },
  { name: "Table Tennis", category: "sports", roles: ["Singles", "Doubles"], event: "Interschool Table Tennis Cup", minGrade: 5 },
  { name: "Chess", category: "sports", roles: ["Board 1", "Rapid Player", "Blitz Player"], event: "Junior Chess Championship", minGrade: 3 },
  { name: "English Debate", category: "debate", roles: ["First Speaker", "Rebuttal Speaker", "Team Captain", "Closing Speaker"], event: "Interschool English Debate Championship", minGrade: 6 },
  { name: "Urdu Speech", category: "debate", roles: ["Orator", "Declamation Speaker"], event: "Urdu Declamation Contest", minGrade: 3 },
  { name: "English Speech", category: "debate", roles: ["English Orator", "Elocution Speaker"], event: "English Elocution Contest", minGrade: 1 },
  { name: "Model UN", category: "debate", roles: ["Head Delegate", "Delegate", "Chair"], event: "Lahore Model United Nations", minGrade: 8 },
  { name: "Painting", category: "arts", roles: ["Watercolour", "Oil & Acrylic", "Sketching"], event: "Young Artists Exhibition", minGrade: 1 },
  { name: "Drama", category: "arts", roles: ["Lead Actor", "Supporting Actor", "Stage Director"], event: "Interschool Drama Festival", minGrade: 4 },
  { name: "Singing", category: "arts", roles: ["Lead Vocalist", "Choir", "Qawwali Group"], event: "Youth Music Festival", minGrade: 1 },
  { name: "Instrumental Music", category: "arts", roles: ["Guitar", "Keyboard", "Tabla", "Violin"], event: "Youth Music Festival", minGrade: 4 },
  { name: "Calligraphy", category: "arts", roles: ["Urdu Calligraphy", "Arabic Calligraphy"], event: "National Calligraphy Competition", minGrade: 3 },
  { name: "English Poetry", category: "writing", roles: ["Poet", "Spoken Word"], event: "Young Writers Literary Festival", minGrade: 4 },
  { name: "Urdu Poetry", category: "writing", roles: ["Shayar", "Bait Bazi"], event: "Bait Bazi Championship", minGrade: 5 },
  { name: "Short Stories", category: "writing", roles: ["Fiction Writer", "Storyteller"], event: "Young Writers Literary Festival", minGrade: 3 },
  { name: "Journalism", category: "writing", roles: ["School Magazine Editor", "Reporter"], event: "Student Journalism Awards", minGrade: 7 },
  { name: "Robotics", category: "stem", roles: ["Team Lead", "Builder", "Programmer"], event: "National Robotics Olympiad", minGrade: 6 },
  { name: "Coding", category: "stem", roles: ["Web Developer", "Competitive Programmer", "Game Developer"], event: "Junior Coding Hackathon", minGrade: 5 },
  { name: "Science Fair", category: "stem", roles: ["Project Lead", "Researcher"], event: "Lahore Science Expo", minGrade: 4 },
  { name: "Math Olympiad", category: "stem", roles: ["Olympiad Team", "Problem Solver"], event: "Pakistan Math Olympiad", minGrade: 4 },
];

const skillOf = (name: string) => skills.find((s) => s.name === name)!;

/** Suggested positions for a skill from the starter catalog (empty for custom skills). */
export const rolesFor = (name: string) => skills.find((s) => sameText(s.name, name))?.roles ?? [];

/** Suggested category for a skill typed by the principal, if the catalog knows it. */
export const catalogCategoryOf = (name: string) => {
  const k = skills.find((s) => sameText(s.name, name));
  return k ? labelOf(k.category) : undefined;
};

export type Level = "beginner" | "intermediate" | "team" | "interschool" | "champion";

/** Lowest to highest honor. */
export const levels: { key: Level; label: string; short: string }[] = [
  { key: "beginner", label: "Beginner", short: "Beginner" },
  { key: "intermediate", label: "Intermediate", short: "Intermediate" },
  { key: "team", label: "School Team Member", short: "School Team" },
  { key: "interschool", label: "Inter-School Participant", short: "Inter-School" },
  { key: "champion", label: "Champion / Gold Medalist", short: "Award Winner" },
];

export const levelOf = (key: Level) => levels.find((l) => l.key === key)!;
export const levelRank = (key: Level) => levels.findIndex((l) => l.key === key);

export type TalentEvent = {
  /** ISO date. */
  date: string;
  title: string;
  scope: "School" | "District" | "Regional" | "National";
  result: string;
  skill: string;
  category: string;
};

export type MentorRemark = { by: string; role: string; date: string; text: string };

/** A skill as recorded on a profile: free-text name plus its free-text category. */
export type SkillTag = { skill: string; category: string };

export type Talent = {
  id: string;
  student: Student;
  primary: SkillTag & { role: string };
  extra: SkillTag[];
  level: Level;
  achievements: string[];
  history: TalentEvent[];
  remarks: MentorRemark[];
};

export type Competition = { id: string; title: string; date: string; category: string };

/** Competitions the principal can shortlist candidates for. */
export const competitions: Competition[] = [
  { id: "c1", title: "Inter-School Sports Gala 2026", date: "2026-11-06", category: SPORTS },
  { id: "c2", title: "Punjab Youth Debate Championship", date: "2026-11-14", category: DEBATE },
  { id: "c3", title: "Lahore Arts & Literary Festival", date: "2026-11-28", category: labelOf("arts") },
  { id: "c4", title: "National Robotics & Coding Olympiad", date: "2026-12-05", category: labelOf("stem") },
];

/** Default competition for a category; writing goes to the literary festival, custom ones to the first event. */
export const competitionFor = (category: string) =>
  competitions.find((c) => sameText(c.category, sameText(category, labelOf("writing")) ? labelOf("arts") : category)) ?? competitions[0];

const mentors: Record<CategoryKey, { name: string; role: string }> = {
  sports: { name: "Waqas Anwar", role: "Head Sports Coach" },
  debate: { name: "Rabia Saeed", role: "Debating Society Coordinator" },
  arts: { name: "Kamran Haider", role: "Arts & Music Coordinator" },
  writing: { name: "Nazia Rauf", role: "Literary Society Coordinator" },
  stem: { name: "Faisal Mehmood", role: "STEM Club Mentor" },
};

/** Coordinator for a category label; custom categories go to the co-curricular office. */
export const mentorFor = (category: string) => {
  const key = categories.find((c) => sameText(c.label, category))?.key;
  return key ? mentors[key] : { name: "Co-Curricular Office", role: "Activities Coordinator" };
};

const remarkText: Record<Level, string[]> = {
  beginner: ["Shows genuine interest and attends every club session. Needs regular practice to build confidence.", "A promising start. Should be encouraged to take part in house-level events this term."],
  intermediate: ["Steady improvement over the term. Ready to try out for the school team next season.", "Good technique and a positive attitude. Consistency in practice will take them further."],
  team: ["A dependable member of the school team who leads by example during practice.", "Works well under pressure and supports younger teammates. Strong candidate for inter-school events."],
  interschool: ["Represented the school with real composure against strong opponents. Ready for bigger stages.", "Competes with discipline and maturity. Recommend for the next inter-school delegation."],
  champion: ["An exceptional talent and a role model for the club. Deserves every opportunity at national level.", "Outstanding performer who raised the school's profile this year. Should lead the next delegation."],
};

const resultFor: Record<Level, string[]> = {
  beginner: ["Participant"],
  intermediate: ["Participant", "House Finalist"],
  team: ["Participant", "Semi-finalist", "Merit Certificate"],
  interschool: ["Runner-up", "Bronze Medal", "Semi-finalist", "Merit Certificate"],
  champion: ["Gold Medal", "Winner", "Best Performer"],
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-03-12" to "12 Mar 2026". */
export const shortDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
};

const pad = (n: number) => String(n).padStart(2, "0");
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];

/** One-line headline honor for the card, e.g. "Gold Medal - District Interschool Cricket Cup 2025". */
export function headline(level: Level, skill: Skill, r: number, year: number) {
  switch (level) {
    case "champion":
      return `${pick(["Gold Medal", "Winner", "Best Performer"], r)} - ${pick(["District", "Regional"], r * 7)} ${skill.event} ${year}`;
    case "interschool":
      return `${pick(["Runner-up", "Bronze Medal", "Semi-finalist"], r)} - ${skill.event} ${year}`;
    case "team":
      return `School ${skill.name} team member, ${year} season`;
    case "intermediate":
      return `House competition finalist, ${skill.name} ${year}`;
    default:
      return `Joined the ${skill.name} club, ${year}`;
  }
}

function buildHistory(seed: number, level: Level, primary: Skill, extra: string[]): TalentEvent[] {
  const rank = levelRank(level);
  const count = 1 + rank + Math.floor(hash(seed, 41) * 2);
  const out: TalentEvent[] = [];
  for (let k = 0; k < count; k++) {
    const r = hash(seed, 50 + k);
    // Most events are in the primary skill; a few in the extras.
    const skill = extra.length && r < 0.25 ? skillOf(pick(extra, hash(seed, 60 + k))) : primary;
    // The newest event carries the student's top honor; older ones step down.
    const at = Math.max(0, rank - k);
    const lv = levels[at].key;
    const scope = at >= 4 ? pick(["District", "Regional", "National"] as const, r) : at === 3 ? pick(["District", "Regional"] as const, r) : "School";
    const year = 2026 - Math.floor(k / 2);
    const month = k % 2 === 0 ? 1 + Math.floor(r * 9) : 1 + Math.floor(r * 11);
    const date = `${year}-${pad(Math.min(month, year === 2026 ? 9 : 12))}-${pad(1 + Math.floor(hash(seed, 70 + k) * 27))}`;
    out.push({
      date,
      title: scope === "School" ? `${pick(["Annual", "Inter-House", "Spring"], r)} ${skill.name} ${pick(["Competition", "Trials", "Showcase"], hash(seed, 80 + k))}` : `${scope} ${skill.event}`,
      scope,
      result: pick(resultFor[lv], hash(seed, 90 + k)),
      skill: skill.name,
      category: labelOf(skill.category),
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function build(): Talent[] {
  const out: Talent[] = [];
  for (const s of students) {
    const r = (n: number) => hash(s.seed * 13 + n, 97);
    // Roughly one student in five carries a profiled talent.
    if (r(1) > 0.21) continue;
    const grade = gradeNum(s.section);
    const open = skills.filter((k) => k.minGrade <= grade);
    const primary = pick(open, r(2));
    const extraCount = r(3) < 0.45 ? 0 : r(3) < 0.8 ? 1 : 2;
    const extra = [...new Set(Array.from({ length: extraCount }, (_, k) => pick(open, r(4 + k)).name))].filter((n) => n !== primary.name);
    // Older students reach higher honors more often.
    const lv = Math.min(4, Math.floor(r(8) * (grade <= 3 ? 2.4 : grade <= 6 ? 4 : 5.2)));
    const level = levels[lv].key;
    const history = buildHistory(s.seed, level, primary, extra);
    const mentor = mentors[primary.category];
    const second = extra.length ? mentors[skillOf(extra[0]).category] : mentor;
    out.push({
      id: `t${s.seed}`,
      student: s,
      primary: { skill: primary.name, category: labelOf(primary.category), role: pick(primary.roles, r(9)) },
      extra: extra.map((n) => ({ skill: n, category: labelOf(skillOf(n).category) })),
      level,
      achievements: [headline(level, primary, r(10), Number(history[0].date.slice(0, 4)))],
      history,
      remarks: [
        { by: mentor.name, role: mentor.role, date: `2026-${pad(8 + Math.floor(r(11) * 2))}-${pad(2 + Math.floor(r(12) * 26))}`, text: pick(remarkText[level], r(13)) },
        ...(extra.length && r(14) < 0.6
          ? [{ by: second.name, role: second.role, date: `2026-0${3 + Math.floor(r(15) * 5)}-${pad(2 + Math.floor(r(16) * 26))}`, text: pick(remarkText[levels[Math.max(0, lv - 1)].key], r(17)) }]
          : []),
      ],
    });
  }
  return out;
}

export const talents = build();

/** Initial competition pool: award winners and inter-school players from Grade 6 up. */
export const initialShortlist: Record<string, string> = Object.fromEntries(
  talents
    .filter((t) => levelRank(t.level) >= 3 && gradeNum(t.student.section) >= 6 && hash(t.student.seed, 123) < 0.55)
    .map((t) => [t.id, competitionFor(t.primary.category).id]),
);

/** Every skill a talent profile covers, primary first. */
export const tagsOf = (t: Talent): SkillTag[] => [t.primary, ...t.extra];
export const skillsOf = (t: Talent) => tagsOf(t).map((g) => g.skill);
export const categoriesOf = (t: Talent) => [...new Set(tagsOf(t).map((g) => g.category))];

/**
 * Categories and skills currently in use, built from the records themselves so anything the
 * principal types shows up in the filters. Starter categories come first, then by popularity.
 */
export function catalogFrom(list: Talent[]) {
  const cats = new Map<string, number>();
  const skillMap = new Map<string, { skill: string; category: string; count: number }>();
  for (const t of list) {
    for (const c of categoriesOf(t)) cats.set(c, (cats.get(c) ?? 0) + 1);
    for (const g of tagsOf(t)) {
      const key = `${g.category}|${g.skill}`;
      const hit = skillMap.get(key);
      if (hit) hit.count++;
      else skillMap.set(key, { ...g, count: 1 });
    }
  }
  const rank = (label: string) => {
    const i = categories.findIndex((c) => c.label === label);
    return i < 0 ? categories.length : i;
  };
  return {
    categories: [...cats].map(([label, count]) => ({ label, count })).sort((a, b) => rank(a.label) - rank(b.label) || b.count - a.count || a.label.localeCompare(b.label)),
    skills: [...skillMap.values()].sort((a, b) => a.skill.localeCompare(b.skill)),
  };
}


/** Snapshot date for documents, e.g. "13 Oct 2026". */
export const AS_OF_LABEL = shortDate(AS_OF);
