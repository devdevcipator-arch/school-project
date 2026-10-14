import { Icon } from "@/components/ui/Icon";
import { categories, categoryIcon, levelOf, levelRank, type Level, type SkillTag } from "@/lib/talents";

type Tone = { pill: string; chip: string; dot: string; soft: string };

/**
 * Category accent colors, used only on talent badges so clusters scan at a glance:
 * emerald sports, amber debate, indigo arts, rose writing, cyan STEM.
 */
const starterTones: Tone[] = [
  { pill: "bg-emerald-600 text-white", chip: "border-emerald-600/25 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500", soft: "bg-emerald-50 text-emerald-700" },
  { pill: "bg-amber-500 text-ink", chip: "border-amber-500/30 bg-amber-50 text-amber-800", dot: "bg-amber-500", soft: "bg-amber-50 text-amber-700" },
  { pill: "bg-indigo-600 text-white", chip: "border-indigo-600/25 bg-indigo-50 text-indigo-800", dot: "bg-indigo-500", soft: "bg-indigo-50 text-indigo-700" },
  { pill: "bg-rose-600 text-white", chip: "border-rose-600/25 bg-rose-50 text-rose-800", dot: "bg-rose-500", soft: "bg-rose-50 text-rose-700" },
  { pill: "bg-cyan-600 text-white", chip: "border-cyan-600/25 bg-cyan-50 text-cyan-800", dot: "bg-cyan-500", soft: "bg-cyan-50 text-cyan-700" },
];

/** Custom categories typed by the principal get a stable color picked by name. */
const customTones: Tone[] = [
  { pill: "bg-violet-600 text-white", chip: "border-violet-600/25 bg-violet-50 text-violet-800", dot: "bg-violet-500", soft: "bg-violet-50 text-violet-700" },
  { pill: "bg-teal-600 text-white", chip: "border-teal-600/25 bg-teal-50 text-teal-800", dot: "bg-teal-500", soft: "bg-teal-50 text-teal-700" },
  { pill: "bg-orange-600 text-white", chip: "border-orange-600/25 bg-orange-50 text-orange-800", dot: "bg-orange-500", soft: "bg-orange-50 text-orange-700" },
  { pill: "bg-sky-600 text-white", chip: "border-sky-600/25 bg-sky-50 text-sky-800", dot: "bg-sky-500", soft: "bg-sky-50 text-sky-700" },
  { pill: "bg-fuchsia-600 text-white", chip: "border-fuchsia-600/25 bg-fuchsia-50 text-fuchsia-800", dot: "bg-fuchsia-500", soft: "bg-fuchsia-50 text-fuchsia-700" },
  { pill: "bg-lime-600 text-white", chip: "border-lime-600/25 bg-lime-50 text-lime-800", dot: "bg-lime-500", soft: "bg-lime-50 text-lime-700" },
];

export function categoryTone(label: string): Tone {
  const i = categories.findIndex((c) => c.label.toLowerCase() === label.trim().toLowerCase());
  if (i >= 0) return starterTones[i];
  let h = 0;
  for (const ch of label.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return customTones[h % customTones.length];
}

/** Prominent primary talent tag, e.g. "Cricket - Captain". */
export function PrimaryTalent({ skill, category, role }: SkillTag & { role: string }) {
  return (
    <span title={category} className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-[.76rem] font-bold ${categoryTone(category).pill}`}>
      <Icon d={categoryIcon(category)} className="size-3.5 shrink-0" />
      <span className="truncate">
        {skill}
        {role && ` - ${role}`}
      </span>
    </span>
  );
}

/** Secondary skill chips for multi-talented students, e.g. "+ Chess". */
export function SkillChips({ list }: { list: SkillTag[] }) {
  if (!list.length) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {list.map((g) => (
        <span key={`${g.category}|${g.skill}`} title={g.category} className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[.72rem] font-bold ${categoryTone(g.category).chip}`}>
          + {g.skill}
        </span>
      ))}
    </span>
  );
}

const levelStyle = ["bg-ink/6 text-ink/60", "bg-accent/12 text-[#3d6e71]", "bg-primary/10 text-primary", "bg-primary text-surface", "bg-linear-135 from-[#b8860b] to-[#e0b23a] text-ink"];
const levelIcon = [
  "M12 5v14 M5 12h14",
  "M5 15l7-7 7 7",
  "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M16 3.5a4 4 0 0 1 0 7.5 M18 14c2.4.8 4 3.2 4 7",
  "M3 21h18 M5 21V10l7-5 7 5v11 M10 21v-5h4v5",
  "M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0z M7 6H4a3 3 0 0 0 3 4 M17 6h3a3 3 0 0 1-3 4",
];

/** Proficiency / honor level badge (icon + label). */
export function LevelBadge({ level, short = false }: { level: Level; short?: boolean }) {
  const i = levelRank(level);
  const l = levelOf(level);
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[.72rem] font-bold ${levelStyle[i]}`}>
      <Icon d={levelIcon[i]} className="size-3" />
      {short ? l.short : l.label}
    </span>
  );
}

export const trophyIcon = levelIcon[4];
