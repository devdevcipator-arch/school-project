import { Icon } from "@/components/ui/Icon";
import { studentBlueprints, type BlueprintSection } from "@/lib/student";

const spanClass: Record<BlueprintSection["span"], string> = {
  4: "lg:col-span-4",
  6: "lg:col-span-6",
  8: "lg:col-span-8",
  12: "lg:col-span-12",
};

/** Structural layout of a student page: one placeholder panel per planned section. */
export default function PageScaffold({ path }: { path: string }) {
  const sections = studentBlueprints[path] ?? [];
  return (
    <main className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] py-6 lg:py-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
        {sections.map((s) => (
          <section
            key={s.title}
            className={`flex min-w-0 flex-col rounded-[20px] border border-dashed border-ink/15 bg-white p-5 shadow-[0_10px_30px_rgba(6,30,41,.05)] sm:p-6 ${
              s.span === 12 ? "sm:col-span-2" : ""
            } ${spanClass[s.span]} ${s.tall ? "min-h-[300px]" : "min-h-[150px]"}`}
          >
            <header className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-135 from-primary to-accent text-surface">
                <Icon d={s.icon} className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[1.05rem] font-extrabold tracking-tight">{s.title}</h2>
                <p className="mt-0.5 text-[.84rem] text-ink/55">{s.note}</p>
              </div>
            </header>
            <div aria-hidden className="mt-5 grid flex-1 gap-2.5">
              <span className="h-2.5 w-3/4 rounded-full bg-ink/6" />
              <span className="h-2.5 w-1/2 rounded-full bg-ink/6" />
              {s.tall && <span className="mt-2 flex-1 rounded-2xl bg-surface" />}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
