import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { principalNav } from "@/lib/principal";

// Placeholder for principal sections that are not built yet.
const sections = principalNav.filter((n) => !["/principal", "/principal/announcements", "/principal/teachers"].includes(n.href));

export function generateStaticParams() {
  return sections.map((n) => ({ section: n.href.split("/").pop()! }));
}

export default async function SectionPage({ params }: PageProps<"/principal/[section]">) {
  const { section } = await params;
  const item = sections.find((n) => n.href.endsWith(`/${section}`));
  if (!item) notFound();

  return (
    <main className="grid min-h-[calc(100dvh-8.5rem)] place-items-center p-6 lg:min-h-[calc(100dvh-5rem)]">
      <div data-reveal className="grid max-w-[440px] justify-items-center gap-4 rounded-[22px] border border-ink/10 bg-white p-10 text-center shadow-[0_20px_50px_rgba(6,30,41,.08)]">
        <span className="grid size-16 place-items-center rounded-2xl bg-linear-135 from-primary to-accent text-surface">
          <Icon d={item.icon} className="size-8" />
        </span>
        <h1 className="text-[1.5rem] font-extrabold tracking-tight">{item.label}</h1>
        <p className="text-ink/65">This section is coming soon. It is next on the principal portal roadmap.</p>
        <ButtonLink href="/principal" variant="dark">Back to Overview</ButtonLink>
      </div>
    </main>
  );
}
