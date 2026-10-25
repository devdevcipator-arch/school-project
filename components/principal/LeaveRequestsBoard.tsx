"use client";

import { Card, Badge } from "@/components/dashboard/ui";
import { Avatar } from "@/components/teachers/parts";
import { buttonClass } from "@/components/ui/Button";
import { ghostSm } from "@/components/dashboard/controls";
import { shortDate } from "@/lib/fees";
import { setLeaveStatus, useLeaveRequests, type LeaveStatus } from "@/lib/leaveRequests";

const tone: Record<LeaveStatus, "warn" | "ok" | "danger"> = { Pending: "warn", Approved: "ok", Declined: "danger" };

/** Every leave request teachers send from My Attendance, newest first. */
export default function LeaveRequestsBoard() {
  const list = useLeaveRequests();
  const pending = list.filter((r) => r.status === "Pending").length;

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-5 px-[clamp(16px,3vw,36px)] py-6 lg:gap-6 lg:py-8">
      <Card title="Teacher Leave Requests" subtitle={pending ? `${pending} waiting for your answer` : "No requests waiting"}>
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
                {r.status === "Pending" ? (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setLeaveStatus(r.id, "Approved")} className={buttonClass("primary", "md", "cursor-pointer !px-4 !py-2 text-[.84rem]")}>
                      Approve
                    </button>
                    <button type="button" onClick={() => setLeaveStatus(r.id, "Declined")} className={`${ghostSm} hover:!bg-danger/8 hover:!text-danger`}>
                      Decline
                    </button>
                  </div>
                ) : (
                  <Badge tone={tone[r.status]} className="self-start">
                    {r.status}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
