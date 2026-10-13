import { Badge, Bar, toneFill, toneText, type Tone } from "@/components/dashboard/ui";
import { DEFAULTER_BELOW, type DayStatus } from "@/lib/students";

export const statusMeta: Record<DayStatus, { label: string; tone: Tone; dot: string }> = {
  present: { label: "Present", tone: "ok", dot: "bg-ok" },
  absent: { label: "Absent", tone: "danger", dot: "bg-danger" },
  leave: { label: "On Leave", tone: "warn", dot: "bg-warn" },
};

/** Today's real-time status: Present (green), Absent (red), On Leave (amber). */
export function StatusBadge({ status }: { status: DayStatus }) {
  const m = statusMeta[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

export const rateTone = (rate: number): Tone => (rate < DEFAULTER_BELOW ? "danger" : rate < 85 ? "warn" : "ok");

/** Term attendance bar with a defaulter chip below the threshold. */
export function AttendanceMeter({ rate, name }: { rate: number; name: string }) {
  const tone = rateTone(rate);
  return (
    <div className="grid min-w-[150px] gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[.84rem] font-extrabold ${toneText[tone]}`}>{rate}%</span>
        {rate < DEFAULTER_BELOW && <Badge tone="danger">Defaulter</Badge>}
      </div>
      <Bar value={rate} fill={toneFill[tone]} label={`${name}: ${rate}% term attendance`} />
    </div>
  );
}
