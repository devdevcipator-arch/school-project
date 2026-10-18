"use client";

import { useState } from "react";
import { Chip, Drawer, ghostBtn } from "@/components/dashboard/controls";
import { Badge } from "@/components/dashboard/ui";
import { Icon } from "@/components/ui/Icon";
import type { AuditEntry, AuditKind } from "@/lib/copilot";

const allKinds: { key: AuditKind; label: string; icon: string }[] = [
  { key: "teacher", label: "Teachers", icon: "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" },
  { key: "student", label: "Students", icon: "M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" },
  { key: "announcement", label: "Announcements", icon: "M3 11l15-6v14L3 13z M7 13v5h3v-4" },
  { key: "assessment", label: "Assessments", icon: "M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3" },
  { key: "report", label: "Report remarks", icon: "M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6" },
  { key: "vault", label: "Knowledge vault", icon: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z M8 7h6" },
  { key: "session", label: "Sessions", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const when = (iso: string) => {
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  return `${Number(iso.slice(8, 10))} ${months[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}, ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** Every action the copilot executed or was told to discard, newest first. */
export default function AuditDrawer({ entries, owner, kinds: allowed, onClose }: { entries: AuditEntry[]; owner: string; kinds: AuditKind[]; onClose: () => void }) {
  const kinds = allKinds.filter((k) => allowed.includes(k.key));
  const [kind, setKind] = useState<AuditKind | "all">("all");
  const shown = entries.filter((e) => kind === "all" || e.kind === kind);
  return (
    <Drawer
      width="max-w-[640px]"
      title="Audit Trail & Action History"
      subtitle={`${entries.filter((e) => e.status === "executed").length} executed · ${entries.filter((e) => e.status === "cancelled").length} cancelled · by ${owner} via AI Copilot`}
      onClose={onClose}
      footer={(close) => (
        <button type="button" onClick={close} className={`${ghostBtn} ml-auto max-sm:w-full`}>
          Close
        </button>
      )}
    >
      {() => (
        <div className="grid gap-5 px-5 py-6 sm:px-7">
          <div role="group" aria-label="Action type" className="flex flex-wrap gap-2">
            <Chip type="radio" name="audit-kind" checked={kind === "all"} onChange={() => setKind("all")}>
              All ({entries.length})
            </Chip>
            {kinds.map((k) => (
              <Chip key={k.key} type="radio" name="audit-kind" checked={kind === k.key} onChange={() => setKind(k.key)}>
                {k.label} ({entries.filter((e) => e.kind === k.key).length})
              </Chip>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-8 text-center text-[.86rem] text-ink/55">No actions of this type yet.</p>
          ) : (
            <ol className="relative grid gap-3 before:absolute before:inset-y-3 before:left-[19px] before:w-px before:bg-ink/10">
              {shown.map((e) => {
                const k = kinds.find((x) => x.key === e.kind)!;
                return (
                  <li key={e.id} className="relative grid grid-cols-[40px_1fr] gap-3">
                    <span className={`relative z-10 grid size-10 place-items-center rounded-xl ring-4 ring-white ${e.status === "executed" ? "bg-primary text-surface" : "bg-ink/8 text-ink/50"}`}>
                      <Icon d={k.icon} className="size-5" />
                    </span>
                    <div className="rounded-2xl border border-ink/8 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">{e.action}</p>
                        <Badge tone={e.status === "executed" ? "ok" : "neutral"}>{e.status === "executed" ? "Executed" : "Cancelled"}</Badge>
                      </div>
                      <p className="mt-0.5 text-[.84rem] text-ink/70">{e.detail}</p>
                      <p className="mt-1 text-[.74rem] text-ink/45">{when(e.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </Drawer>
  );
}
