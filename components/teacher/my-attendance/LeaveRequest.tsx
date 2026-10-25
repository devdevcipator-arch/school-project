"use client";

import { useState } from "react";
import { fieldClass } from "@/components/dashboard/controls";
import { Card } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sendLeaveRequest } from "@/lib/leaveRequests";
import { me } from "@/lib/myAttendance";

/** One reason box and a send button; the request appears on the principal's Leave Requests page. */
export default function LeaveRequest({ onSent }: { onSent: () => void }) {
  const [reason, setReason] = useState("");

  const send = () => {
    if (!reason.trim()) return;
    sendLeaveRequest(me.name, reason.trim());
    setReason("");
    onSent();
  };

  return (
    <Card title="Apply for Leave" subtitle="Your request goes to the principal.">
      <label htmlFor="leave-reason" className="sr-only">
        Reason for leave
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <textarea id="leave-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Write your reason for leave" className={`${fieldClass} w-full flex-1 resize-y`} />
        <button type="button" onClick={send} disabled={!reason.trim()} className={buttonClass("primary", "md", "shrink-0 cursor-pointer disabled:pointer-events-none disabled:opacity-50 max-sm:w-full")}>
          <Icon d="M4 12l16-8-6 16-3-7z" className="size-[18px]" />
          Send Request
        </button>
      </div>
    </Card>
  );
}
