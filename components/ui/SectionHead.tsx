import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function SectionHead({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto mb-12 max-w-[760px] text-center ${className}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 data-reveal className="mb-3 text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-[1.15] tracking-tight">
        {title}
      </h2>
      <p data-reveal className="text-[1.05rem] text-ink/60">{children}</p>
    </div>
  );
}
