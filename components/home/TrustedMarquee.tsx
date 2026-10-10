// Placeholder partner schools until real ones are onboarded.
const schools = [
  { mono: "GS", name: "Greenfield School", city: "Lahore" },
  { mono: "CA", name: "Crescent Academy", city: "Karachi" },
  { mono: "BF", name: "Bright Future High", city: "Islamabad" },
  { mono: "OC", name: "Oakridge Campus", city: "Faisalabad" },
  { mono: "AN", name: "Al-Noor Model School", city: "Multan" },
  { mono: "SP", name: "Summit Public School", city: "Rawalpindi" },
];

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 animate-marquee gap-[18px] pr-[18px] group-hover:[animation-play-state:paused]">
      {schools.map((s) => (
        <li
          key={s.name}
          className="flex min-w-[210px] items-center gap-3 rounded-[14px] border border-ink/10 bg-white py-3.5 pl-3.5 pr-5 transition-[border-color,translate] duration-300 hover:-translate-y-[3px] hover:border-accent sm:min-w-[240px]"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-135 from-ink to-primary text-[.9rem] font-extrabold tracking-[.04em] text-surface">
            {s.mono}
          </span>
          <span className="grid text-[.95rem] font-bold leading-tight">
            {s.name}
            <small className="text-[.78rem] font-medium text-ink/60">{s.city}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function TrustedMarquee() {
  return (
    <div data-reveal className="mt-[72px]">
      <p className="mb-[26px] flex items-center gap-[18px] text-[.8rem] font-bold uppercase tracking-[.14em] text-accent before:h-px before:flex-1 before:bg-ink/10 after:h-px after:flex-1 after:bg-ink/10">
        Trusted by growing schools
      </p>
      <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
