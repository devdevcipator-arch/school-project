"use client";

import { useState } from "react";
import { fieldClass } from "@/components/dashboard/controls";
import { Card } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** One reason box and a send button. Front-end only: the request is not stored yet. */
export default function LeaveRequest({ onSent }: { onSent: () => void }) {
  const [reason, setReason] = useState("");

  const send = () => {
    if (!reason.trim()) return;
    setReason("");
    onSent();
  };

  return (
    <Card title="Apply for Leave" subtitle="Your request goes to the principal.">
      <label htmlFor="leave-reason" className="sr-only">
        Reason for leave
      </label>
      <textarea id="leave-reason" rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Write your reason for leave" className={`${fieldClass} w-full resize-y`} />
      <button type="button" onClick={send} disabled={!reason.trim()} className={buttonClass("primary", "md", "mt-3 w-full cursor-pointer disabled:pointer-events-none disabled:opacity-50")}>
        <Icon d="M4 12l16-8-6 16-3-7z" className="size-[18px]" />
        Send Request
      </button>
    </Card>
  );
}
