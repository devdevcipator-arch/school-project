import Link from "next/link";
import { Bar, Card, CardLink, toneFill, toneText } from "@/components/dashboard/ui";
import { announcements, feeOverview, type Audience } from "@/lib/principal";

function FeeOverview() {
  const f = feeOverview;
  const pct = Math.round((f.monthPaid / f.monthTotal) * 100);
  const maxUnpaid = Math.max(...f.topPending.map((p) => p.unpaid));
  return (
    <Card title="Student Fee Overview" subtitle="Who has paid this month and who has not">
      <div className="rounded-2xl bg-linear-135 from-ink to-primary p-5 text-surface">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[.78rem] font-bold uppercase tracking-[.12em] text-surface/60">Paid this month</p>
            <p className="mt-1 text-[1.6rem] font-extrabold leading-none">
              {f.monthPaid} <span className="text-[.85rem] font-semibold text-surface/65">of {f.monthTotal} students</span>
            </p>
            <p className="mt-2 text-[.82rem] text-surface/70">{f.monthTotal - f.monthPaid} students have not paid yet</p>
          </div>
          <span className="text-[1.25rem] font-extrabold">{pct}%</span>
        </div>
        <div role="meter" aria-label="Students who paid this month" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-4 h-3 overflow-hidden rounded-r-full bg-surface/15">
          <div className="h-full rounded-r-full bg-linear-to-r from-accent to-surface" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <h3 className="mb-3 mt-6 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Not paid, by delay</h3>
      <div className="grid grid-cols-3 gap-2.5">
        {f.aging.map((a) => (
          <div key={a.bucket} className="relative overflow-hidden rounded-2xl border border-ink/8 bg-surface/60 p-3.5">
            <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${toneFill[a.tone]}`} />
            <p className={`text-[1.5rem] font-extrabold leading-none ${toneText[a.tone]}`}>{a.count}</p>
            <p className="mt-1.5 text-[.78rem] font-semibold text-ink/70">{a.bucket}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-3 mt-6 text-[.74rem] font-bold uppercase tracking-[.12em] text-ink/50">Classes with most unpaid students</h3>
      <ul className="grid gap-3">
        {f.topPending.map((p) => (
          <li key={p.grade} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
            <span className="text-[.88rem] font-semibold">
              {p.grade} <span className="font-normal text-ink/50">· {p.total} students</span>
            </span>
            <span className="text-[.86rem] font-bold tabular-nums">{p.unpaid} not paid</span>
            <div className="col-span-2">
              <Bar value={p.unpaid} max={maxUnpaid} fill="bg-accent" label={`${p.grade}: ${p.unpaid} of ${p.total} students not paid`} />
            </div>
          </li>
        ))}
      </ul>
      <CardLink href="/principal/fees">Go to Student Fees Management</CardLink>
    </Card>
  );
}

const audienceTone: Record<Audience, string> = {
  "Teachers Only": "bg-primary/10 text-primary",
  "Students Only": "bg-accent/15 text-[#3d6e71]",
  "School-Wide": "bg-ink text-surface",
};

function Announcements() {
  return (
    <Card
      title="Recent Announcements"
      subtitle="Latest targeted broadcasts"
      action={
        <Link href="/principal/announcements?compose=1" className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-2 text-[.82rem] font-bold text-primary transition-colors hover:bg-primary hover:text-surface">
          <svg viewBox="0 0 20 20" aria-hidden className="size-3.5"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          Compose
        </Link>
      }
    >
      <ul className="grid gap-3">
        {announcements.map((a) => (
          <li key={a.title} className="rounded-2xl border border-ink/8 p-4 transition-[border-color,background-color] duration-300 hover:border-accent/60 hover:bg-surface/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[.72rem] font-bold ${audienceTone[a.audience]}`}>{a.audience}</span>
              <span className="text-[.76rem] text-ink/50">{a.when}</span>
            </div>
            <h3 className="mt-2.5 text-[.95rem] font-bold">{a.title}</h3>
            <p className="mt-1 text-[.86rem] leading-relaxed text-ink/65">{a.text}</p>
          </li>
        ))}
      </ul>
      <CardLink href="/principal/announcements">View all announcements</CardLink>
    </Card>
  );
}

export default function FeesAndNotices() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <FeeOverview />
      <Announcements />
    </div>
  );
}
