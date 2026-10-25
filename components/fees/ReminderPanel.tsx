"use client";

import { useMemo, useState } from "react";
import { Chip, Drawer, ghostBtn } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { shortDate, type FeeRecord } from "@/lib/fees";
import { principal } from "@/lib/principal";

export type Channel = "Email" | "App notification";
const channels: Channel[] = ["Email", "App notification"];

const template = `Dear {guardian}, the school fee of {student} ({class}) was due on {due} and is now overdue by {days} days. Please clear the pending installment at the earliest. - ${principal.school}`;

export const fillMessage = (msg: string, r: FeeRecord) =>
  msg
    .replace(/\{guardian\}/g, r.account.student.guardian)
    .replace(/\{student\}/g, r.account.student.name)
    .replace(/\{class\}/g, r.account.student.section)
    .replace(/\{days\}/g, String(r.overdueDays))
    .replace(/\{due\}/g, r.dueDate ? shortDate(r.dueDate) : "the due date");

export default function ReminderPanel({ records, scope, onSend, onClose }: { records: FeeRecord[]; scope: string; onSend: (to: FeeRecord[], via: Channel[]) => void; onClose: () => void }) {
  const [via, setVia] = useState<Channel[]>(["App notification"]);
  const [message, setMessage] = useState(template);

  // Every student past the due date in the current view.
  const to = useMemo(() => records.filter((r) => r.overdueDays > 0), [records]);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const sample = to[0];

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
            <p className="mt-1.5 text-[.76rem] text-ink/50">Placeholders: {"{guardian} {student} {class} {due} {days}"}</p>
          </div>

          {sample && (
            <section>
              <h3 className="mb-2 text-[.84rem] font-bold">Preview</h3>
              <div className="rounded-2xl bg-ink p-4 text-[.86rem] leading-relaxed text-surface">
                <p className="mb-1.5 text-[.72rem] font-bold uppercase tracking-[.1em] text-surface/50">To {sample.account.student.guardian}</p>
                {fillMessage(message, sample)}
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}
