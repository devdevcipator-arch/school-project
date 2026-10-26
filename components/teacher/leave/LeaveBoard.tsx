"use client";

import { useCallback, useState } from "react";
import { Toast, fieldClass, type ToastData } from "@/components/dashboard/controls";
import { Badge, Card } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { shortDate } from "@/lib/fees";
import { periodLabel, sendLeaveRequest, useLeaveRequests, type LeaveStatus } from "@/lib/leaveRequests";
import { me } from "@/lib/myAttendance";

const tone: Record<LeaveStatus, "warn" | "ok" | "danger"> = { Pending: "warn", Approved: "ok", Declined: "danger" };

/** Apply for leave, then follow each request; rows mirror the principal's Leave Requests page. */
export default function LeaveBoard() {
  const list = useLeaveRequests().filter((r) => r.teacher === me.name);
  const pending = list.filter((r) => r.status === "Pending").length;
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // Same-format local date-times compare correctly as strings.
  const badRange = !!from && !!to && to <= from;
  const ready = !!reason.trim() && !!from && !!to && !badRange;

  const send = () => {
    if (!ready) return;
    sendLeaveRequest(me.name, reason.trim(), from, to);
    setReason("");
    setFrom("");
    setTo("");
    setToast({ text: "Leave request sent to the principal." });
  };

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <Card title="Apply for Leave" subtitle="Your request goes to the principal.">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[.8rem] font-bold text-ink/70">
              From
              <input type="datetime-local" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={`${fieldClass} cursor-pointer font-normal text-ink`} />
            </label>
            <label className="grid gap-1.5 text-[.8rem] font-bold text-ink/70">
              To
              <input
                type="datetime-local"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                aria-invalid={badRange}
                className={`${fieldClass} cursor-pointer font-normal text-ink ${badRange ? "border-danger" : ""}`}
              />
            </label>
          </div>
          {badRange && <p className="-mt-2 text-[.8rem] font-semibold text-danger">The end time must be after the start time.</p>}
          <label className="grid gap-1.5 text-[.8rem] font-bold text-ink/70">
            Reason
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Write your reason for leave" className={`${fieldClass} w-full resize-y font-normal text-ink`} />
          </label>
          <div className="flex justify-end">
            <button type="button" onClick={send} disabled={!ready} className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50 max-sm:w-full")}>
              <Icon d="M4 12l16-8-6 16-3-7z" className="size-[18px]" />
              Send Request
            </button>
          </div>
        </div>
      </Card>

      <Card title="My Leave Requests" subtitle={pending ? `${pending} waiting for the principal` : "No requests waiting"}>
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-[.9rem] text-ink/55">No leave requests yet.</p>
        ) : (
          <ul className="divide-y divide-ink/8">
            {list.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                <Avatar name={r.teacher} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <strong className="text-[.95rem]">{r.teacher}</strong>
                    <span className="text-[.78rem] text-ink/50">Sent {shortDate(r.sent)}</span>
                  </p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-primary/8 px-2.5 py-1 text-[.8rem] font-semibold text-primary">
                    <Icon d="M8 3v3 M16 3v3 M4 7h16v13H4z M4 11h16" className="size-4 shrink-0" />
                    {periodLabel(r)}
                  </p>
                  <p className="mt-1.5 text-[.9rem] leading-relaxed text-ink/75">{r.reason}</p>
                </div>
                <Badge tone={tone[r.status]} className="self-start">
                  {r.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {toast && <Toast {...toast} onDone={clearToast} />}
    </main>
  );
}
