import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";

/** Placeholder for teacher pages whose content has not been specified yet. */
export default function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <main className="mx-auto max-w-[1500px] px-[clamp(16px,3vw,36px)] py-6 lg:py-8">
      <section className="grid justify-items-center gap-4 rounded-[20px] border border-dashed border-ink/15 bg-white px-6 py-16 text-center shadow-[0_10px_30px_rgba(6,30,41,.05)]">
        <span className="grid size-16 place-items-center rounded-2xl bg-linear-135 from-primary to-accent text-surface">
          <Icon d={icon} className="size-8" />
        </span>
        <h2 className="text-[1.3rem] font-extrabold tracking-tight">{title} is on its way</h2>
        <p className="max-w-[440px] text-[.95rem] text-ink/60">This section is being designed. It will be available here soon.</p>
        <Link
          href="/teacher"
          className={buttonClass("primary", "md", "mt-2")}
        >
          Back to Overview
        </Link>
      </section>
    </main>
  );
}
