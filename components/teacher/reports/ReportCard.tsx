"use client";

import { useState } from "react";
import { Drawer, fieldClass, ghostBtn, ghostSm } from "@/components/dashboard/controls";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { printReport } from "@/components/reports/printReport";
import ReportSheet from "@/components/reports/ReportSheet";
import { statusOf, suggestFeedback, type Report } from "@/lib/reports";
import { TERM_LABEL, type Student } from "@/lib/students";

const aiIcon = "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6";

/** High-fidelity preview of one report card with editable remarks and send actions. */
export default function ReportCard({
  s,
  report,
  termLabel,
  rank,
  size,
  onSave,
  onSend,
  onClose,
}: {
  s: Student;
  report: Report;
  termLabel: string;
  rank: number;
  size: number;
  onSave: (r: Report) => void;
  onSend: (r: Report) => void;
  onClose: () => void;
}) {
  const [remark, setRemark] = useState(report.remark);
  const [showRank, setShowRank] = useState(true);
  const r = { ...report, remark };
  const status = statusOf(r);
  const print = () => printReport(s, r, termLabel, showRank ? rank : null, size);

  return (
    <Drawer
      title="Digital Report Card"
      subtitle={`${s.name} · ${termLabel}`}
      width="max-w-[900px]"
      onClose={onClose}
      footer={(close) => (
        <>
          <button type="button" onClick={print} className={ghostBtn}>
            <Icon d="M12 4v11 M7 10l5 5 5-5 M5 20h14" className="size-[18px]" />
            Download PDF
          </button>
          <button type="button" onClick={print} className={ghostBtn}>
            <Icon d="M6 9V3h12v6 M6 18H4v-7h16v7h-2 M8 14h8v7H8z" className="size-[18px]" />
            Print
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => {
              onSave(r);
              close();
            }}
            className={ghostBtn}
          >
            Save Changes
          </button>
          <button
            type="button"
            disabled={!!report.sentAt}
            onClick={() => {
              onSend(r);
              close();
            }}
            className={buttonClass("primary", "md", "cursor-pointer disabled:pointer-events-none disabled:opacity-50")}
          >
            <Icon d="M4 12l16-8-6 16-2-6z" className="size-[18px]" />
            {report.sentAt ? "Already Sent" : "Send Directly to Student"}
          </button>
        </>
      )}
    >
      {() => (
        <div className="bg-surface/60 p-4 sm:p-7">
          <ReportSheet
            s={s}
            report={r}
            termLabel={termLabel}
            rankText={showRank ? `${rank} of ${size}` : "Hidden"}
            controls={
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[.8rem] font-semibold text-ink/65">
                <input type="checkbox" checked={showRank} onChange={(e) => setShowRank(e.target.checked)} className="size-4 accent-[#1D546D]" />
                Show class rank on the card
              </label>
            }
            remarks={
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Class teacher remarks</h3>
                  <button type="button" onClick={() => setRemark(suggestFeedback(s, r))} disabled={!!report.sentAt} className={`${ghostSm} disabled:opacity-40`}>
                    <Icon d={aiIcon} className="size-4" />
                    AI Suggest Feedback
                  </button>
                </div>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  readOnly={!!report.sentAt}
                  rows={3}
                  placeholder="Write a short, constructive remark for the student and parents."
                  className={`${fieldClass} resize-y ${!remark.trim() ? "border-warn" : ""}`}
                />
              </>
            }
            note={`${status === "sent" ? "Dispatched to the student dashboard and parent portal." : status === "ready" ? "Ready to send." : "Draft: complete missing marks and remarks before sending."} Attendance counted for the ${TERM_LABEL.toLowerCase()}.`}
          />
        </div>
      )}
    </Drawer>
  );
}
