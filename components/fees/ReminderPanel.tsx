"use client";

import { useMemo, useState } from "react";
import { Chip, Drawer, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { rs, type FeeRecord } from "@/lib/fees";
import { principal } from "@/lib/principal";

export type Channel = "SMS" | "Email" | "App notification";
const channels: Channel[] = ["SMS", "Email", "App notification"];

type Group = "defaulter" | "delayed" | "partial";
const groups: { key: Group; label: string; hint: string }[] = [
  { key: "defaulter", label: "Critical defaulters", hint: "2+ months unpaid" },
  { key: "delayed", label: "Delayed / overdue", hint: "Past the due date" },
  { key: "partial", label: "Partially paid, overdue", hint: "Balance past due" },
];

const template = `Dear {guardian}, the school fee of {student} ({class}) is overdue by {days} days. Outstanding amount: {amount}. Please clear the dues at the earliest to avoid further late fines. - ${principal.school}`;

export const fillMessage = (msg: string, r: FeeRecord) =>
  msg
    .replace(/\{guardian\}/g, r.account.student.guardian)
    .replace(/\{student\}/g, r.account.student.name)
    .replace(/\{class\}/g, r.account.student.section)
    .replace(/\{days\}/g, String(r.overdueDays))
    .replace(/\{amount\}/g, rs(r.balance));

export default function ReminderPanel({ records, scope, onSend, onClose }: { records: FeeRecord[]; scope: string; onSend: (to: FeeRecord[], via: Channel[]) => void; onClose: () => void }) {
  const [picked, setPicked] = useState<Group[]>(["defaulter", "delayed", "partial"]);
  const [via, setVia] = useState<Channel[]>(["SMS", "App notification"]);
  const [message, setMessage] = useState(template);

  const overdue = useMemo(() => records.filter((r) => r.overdueDays > 0 && r.balance > 0), [records]);
  const count = (g: Group) => overdue.filter((r) => r.status === g).length;
  const to = overdue.filter((r) => picked.includes(r.status as Group));
  const total = to.reduce((n, r) => n + r.balance, 0);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const sample = to[0] ?? overdue[0];

  return (
    <Drawer
      width="max-w-[600px]"
      title="Send Defaulter Reminders"
      subtitle={`Bulk fee reminder to guardians · ${scope}`}
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={close} className={`${ghostBtn} max-sm:flex-1`}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!to.length || !via.length || !message.trim()}
            onClick={() => {
              onSend(to, via);
              close();
            }}
            className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50 max-sm:flex-1 sm:ml-auto")}
          >
            <Icon d="M4 12l16-8-6 16-3-7z" className="size-[18px]" />
            Send to {to.length} {to.length === 1 ? "guardian" : "guardians"}
          </button>
        </>
      )}
    >
      {() => (
        <div className="grid gap-6 px-5 py-6 sm:px-7">
          <fieldset>
            <legend className="mb-2 text-[.84rem] font-bold">Who should be reminded?</legend>
            <div className="grid gap-2">
              {groups.map((g) => (
                <label
                  key={g.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${picked.includes(g.key) ? "border-primary bg-primary/6" : "border-ink/10 hover:border-accent"}`}
                >
                  <input type="checkbox" checked={picked.includes(g.key)} onChange={() => setPicked((p) => toggle(p, g.key))} className="size-4 accent-[#1D546D]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[.9rem] font-bold">{g.label}</span>
                    <span className="text-[.76rem] text-ink/55">{g.hint}</span>
                  </span>
                  <span className="text-[1.1rem] font-extrabold">{count(g.key)}</span>
                </label>
              ))}
            </div>
            <p className="mt-2.5 text-[.8rem] text-ink/60">
              {to.length} {to.length === 1 ? "student" : "students"} selected · {rs(total)} outstanding
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[.84rem] font-bold">Send via</legend>
            <div className="flex flex-wrap gap-2">
              {channels.map((c) => (
                <Chip key={c} type="checkbox" name="reminder-channel" checked={via.includes(c)} onChange={() => setVia((v) => toggle(v, c))}>
                  {c}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="reminder-message" className="mb-1.5 block text-[.84rem] font-bold">
              Message
            </label>
            <textarea
              id="reminder-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-y rounded-xl border border-ink/12 bg-white px-4 py-3 text-[.9rem] outline-none transition-colors hover:border-accent focus:border-primary"
            />
            <p className="mt-1.5 text-[.76rem] text-ink/50">Placeholders: {"{guardian} {student} {class} {days} {amount}"}</p>
          </div>

          {sample && (
            <section>
              <h3 className="mb-2 text-[.84rem] font-bold">Preview</h3>
              <div className="rounded-2xl bg-ink p-4 text-[.86rem] leading-relaxed text-surface">
                <p className="mb-1.5 text-[.72rem] font-bold uppercase tracking-[.1em] text-surface/50">To {sample.account.student.phone}</p>
                {fillMessage(message, sample)}
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}
