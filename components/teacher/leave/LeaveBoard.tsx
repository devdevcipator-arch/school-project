"use client";

import { useCallback, useState } from "react";
import { Toast, fieldClass, type ToastData } from "@/components/dashboard/controls";
import { Badge, Card } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { shortDate } from "@/lib/fees";
import { sendLeaveRequest, useLeaveRequests, type LeaveStatus } from "@/lib/leaveRequests";
import { me } from "@/lib/myAttendance";

const tone: Record<LeaveStatus, "warn" | "ok" | "danger"> = { Pending: "warn", Approved: "ok", Declined: "danger" };

/** Apply for leave, then follow each request; rows mirror the principal's Leave Requests page. */
export default function LeaveBoard() {
  const list = useLeaveRequests().filter((r) => r.teacher === me.name);
  const pending = list.filter((r) => r.status === "Pending").length;
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const send = () => {
    if (!reason.trim()) return;
    sendLeaveRequest(me.name, reason.trim());
    setReason("");
    setToast({ text: "Leave request sent to the principal." });
  };

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <Card title="Apply for Leave" subtitle="Your request goes to the principal.">
        <label htmlFor="leave-reason" className="sr-only">
          Reason for leave
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <textarea id="leave-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Write your reason for leave" className={`${fieldClass} w-full flex-1 resize-y`} />
          <button type="button" onClick={send} disabled={!reason.trim()} className={buttonClass("primary", "md", "shrink-0 cursor-pointer disabled:pointer-events-none disabled:opacity-50 max-sm:w-full")}>
            <Icon d="M4 12l16-8-6 16-3-7z" className="size-[18px]" />
            Send Request
          </button>
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
                  <p className="mt-1 text-[.9rem] leading-relaxed text-ink/75">{r.reason}</p>
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
