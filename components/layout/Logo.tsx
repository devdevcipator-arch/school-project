import Link from "next/link";
import { useId } from "react";
import { site } from "@/lib/site";

export function Logo() {
  // Unique gradient id: a hidden duplicate logo (e.g. a mobile-only bar) would otherwise break url(#id).
  const gradId = useId();
  return (
    <Link href="/" aria-label={`${site.name} home`} className="inline-flex items-center gap-2.5 text-[1.3rem] font-extrabold text-surface">
      <svg viewBox="0 0 40 40" className="size-[38px] shrink-0" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1D546D" />
            <stop offset="1" stopColor="#5F9598" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill={`url(#${gradId})`} />
        <path d="M20 9 6 16l14 7 11-5.5V25h3v-9L20 9Z" fill="#F3F4F4" />
        <path d="M12 21.5V27c0 2.2 3.6 4 8 4s8-1.8 8-4v-5.5l-8 4-8-4Z" fill="#061E29" opacity=".55" />
      </svg>
      <span>
        {site.nameParts[0]}
        <span className="text-accent">{site.nameParts[1]}</span>
      </span>
    </Link>
  );
}
