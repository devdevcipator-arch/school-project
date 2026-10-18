"use client";

import { useState } from "react";
import { Drawer, Select, fieldClass, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { Badge, Bar, Card, type Tone } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { leavePolicy, type LeaveRequest, type LeaveStatus } from "@/lib/myAttendance";
import { shortDay, workingDaysBetween } from "./shared";

const statusTone: Record<LeaveStatus, Tone> = { Approved: "ok", Pending: "warn", Rejected: "danger" };
const plus = "M12 5v14 M5 12h14";
const labelCls = "grid gap-1.5 text-[.8rem] font-bold text-ink/70";

function LeaveForm({ todayIso, left, onSubmit, close }: { todayIso: string; left: Record<string, number>; onSubmit: (r: Omit<LeaveRequest, "id" | "status" | "submitted">) => void; close: () => void }) {
  const [type, setType] = useState(leavePolicy[0].type);
  const [from, setFrom] = useState(todayIso);
  const [to, setTo] = useState(todayIso);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);

  const days = to >= from ? workingDaysBetween(from, to) : 0;
  const errors = {
    to: to < from ? "End date must be on or after the start date." : days === 0 ? "Pick at least one school day (Mon to Fri)." : "",
    reason: reason.trim().length < 5 ? "Add a short reason for the principal." : "",
  };
  const over = days > (left[type] ?? 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errors.to || errors.reason) return;
    onSubmit({ type, from, to, days, reason: reason.trim() });
    close();
  };

  return (
    <form id="leave-form" onSubmit={submit} className="grid gap-5 p-5 sm:p-7">
      <label className={labelCls}>
        Leave type
        <Select label="Leave type" value={type} onChange={setType}>
          {leavePolicy.map((p) => (
            <option key={p.type} value={p.type}>
              {p.type} ({left[p.type] ?? 0} days left)
            </option>
          ))}
        </Select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          From
          <input type="date" value={from} min={todayIso} onChange={(e) => setFrom(e.target.value)} className={fieldClass} required />
        </label>
        <label className={labelCls}>
          To
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={fieldClass} aria-invalid={tried && !!errors.to} required />
        </label>
      </div>
      {tried && errors.to ? (
        <p className="-mt-3 text-[.8rem] font-semibold text-danger">{errors.to}</p>
      ) : (
        <div className="-mt-1 flex flex-wrap items-center gap-2 text-[.82rem] text-ink/60">
          <Badge tone={over ? "warn" : "neutral"}>
            {days} school {days === 1 ? "day" : "days"}
          </Badge>
          {over && <span className="font-semibold text-[#9a6a0f]">More than your remaining {type.toLowerCase()} balance; the principal will decide.</span>}
        </div>
      )}
      <label className={labelCls}>
        Reason
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. Medical appointment, family event"
          className={`${fieldClass} resize-y font-normal`}
          aria-invalid={tried && !!errors.reason}
        />
        {tried && errors.reason && <span className="font-semibold text-danger">{errors.reason}</span>}
      </label>
      <p className="rounded-xl bg-primary/6 px-3.5 py-3 text-[.8rem] text-ink/65">
        The request goes to the principal for approval. Pending days show on your calendar with a dashed outline.
      </p>
    </form>
  );
}

/** Leave balance per type, recent requests and the Request Leave form. */
export default function LeaveCard({
  todayIso,
  used,
  requests,
  onRequest,
  onWithdraw,
}: {
  todayIso: string;
  used: Record<string, number>;
  requests: LeaveRequest[];
  onRequest: (r: Omit<LeaveRequest, "id" | "status" | "submitted">) => void;
  onWithdraw: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pendingBy: Record<string, number> = {};
  for (const r of requests) if (r.status === "Pending") pendingBy[r.type] = (pendingBy[r.type] ?? 0) + r.days;
  const left = Object.fromEntries(leavePolicy.map((p) => [p.type, Math.max(0, p.allowed - (used[p.type] ?? 0) - (pendingBy[p.type] ?? 0))]));

  return (
    <Card
      title="Leave & Requests"
      subtitle="Balance for this session"
      action={
        <button type="button" onClick={() => setOpen(true)} className={buttonClass("primary", "md", "cursor-pointer !px-4 !py-2 text-[.84rem]")}>
          <Icon d={plus} className="size-4" />
          Request Leave
        </button>
      }
    >
      <ul className="grid gap-3.5">
        {leavePolicy.map((p) => {
          const u = used[p.type] ?? 0;
          return (
            <li key={p.type} className="grid gap-1.5">
              <span className="flex items-center justify-between gap-2 text-[.86rem]">
                <span className="font-semibold text-ink/75">{p.type}</span>
                <span className="text-[.8rem] text-ink/55">
                  <strong className="text-ink tabular-nums">{left[p.type]}</strong> of {p.allowed} left
                </span>
              </span>
              <Bar value={u + (pendingBy[p.type] ?? 0)} max={p.allowed} fill={u >= p.allowed ? "bg-danger" : "bg-primary"} label={`${p.type}: ${u} used of ${p.allowed}`} />
            </li>
          );
        })}
      </ul>

      <h3 className="mb-3 mt-6 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Recent requests</h3>
      <ul className="grid gap-2.5">
        {requests.slice(0, 4).map((r) => (
          <li key={r.id} className={`rounded-2xl border p-3.5 ${r.status === "Pending" ? "border-warn/40 bg-warn/5" : "border-ink/8"}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="grid min-w-0">
                <span className="text-[.9rem] font-bold">{r.type}</span>
                <span className="text-[.78rem] text-ink/55">
                  {r.from === r.to ? shortDay(r.from) : `${shortDay(r.from)} to ${shortDay(r.to)}`} · {r.days} {r.days === 1 ? "day" : "days"}
                </span>
              </span>
              <Badge tone={statusTone[r.status]}>{r.status}</Badge>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="truncate text-[.8rem] text-ink/60">{r.reason}</p>
              {r.status === "Pending" && (
                <button type="button" onClick={() => onWithdraw(r.id)} className={`${ghostSm} shrink-0 !py-1 text-danger hover:!bg-danger/8 hover:!text-danger`}>
                  Withdraw
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <Drawer
          title="Request Leave"
          subtitle="Sent to the principal for approval"
          width="max-w-[520px]"
          onClose={() => setOpen(false)}
          footer={(close) => (
            <>
              <button type="submit" form="leave-form" className={buttonClass("primary", "md", "cursor-pointer")}>
                <Icon d="M4 12l16-8-6 16-2-6z" className="size-[18px]" />
                Send Request
              </button>
              <button type="button" onClick={close} className={ghostBtn}>
                Cancel
              </button>
            </>
          )}
        >
          {(close) => <LeaveForm todayIso={todayIso} left={left} onSubmit={onRequest} close={close} />}
        </Drawer>
      )}
    </Card>
  );
}
