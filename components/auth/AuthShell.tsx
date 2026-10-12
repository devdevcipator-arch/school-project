import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { Eyebrow, CheckIcon } from "@/components/ui/Eyebrow";

type AuthShellProps = {
  image: string;
  eyebrow: string;
  title: string;
  text: string;
  points: string[];
  children: ReactNode;
};

/**
 * Split-screen layout shared by Login and Sign Up.
 * Left: brand panel over one background image (hidden on small screens).
 * Right: the form card on the light surface.
 */
export default function AuthShell({ image, eyebrow, title, text, points, children }: AuthShellProps) {
  return (
    <main className="grid min-h-dvh bg-surface lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel, background image 1 of 1 */}
      <aside className="relative isolate hidden overflow-hidden bg-ink text-surface lg:flex lg:flex-col">
        <Image src={image} alt="" fill preload sizes="50vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,rgba(6,30,41,.95)_0%,rgba(6,30,41,.86)_55%,rgba(29,84,109,.8)_100%)]" />

        <div className="flex h-full flex-col p-10 xl:p-14">
          <Logo />
          <div className="my-auto max-w-[480px] py-12">
            <div>
              <Eyebrow light>{eyebrow}</Eyebrow>
            </div>
            <h1 data-reveal className="mb-4 text-[clamp(2rem,3.2vw,2.9rem)] font-extrabold leading-[1.1] tracking-tight">
              {title}
            </h1>
            <p data-reveal className="mb-8 text-surface/80">{text}</p>
            <ul className="grid gap-3">
              {points.map((p) => (
                <li key={p} data-reveal className="flex items-center gap-3 text-[.95rem] text-surface/90">
                  <CheckIcon dark />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[.85rem] text-surface/60">Paperless school management for Principals, Teachers and Students.</p>
        </div>
      </aside>

      {/* Form side */}
      <div className="flex flex-col">
        {/* Small screens: dark brand bar instead of the image panel */}
        <div className="flex items-center justify-between bg-linear-135 from-ink to-primary px-[clamp(16px,3.5vw,40px)] py-4 lg:hidden">
          <Logo />
        </div>

        <div className="flex justify-end px-[clamp(16px,3.5vw,40px)] pt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[.9rem] font-semibold text-primary transition-colors hover:text-accent">
            <svg viewBox="0 0 20 20" aria-hidden className="size-4">
              <path d="M16 10H5M9 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-[clamp(16px,3.5vw,40px)] py-10">
          <div data-reveal className="w-full max-w-[480px] rounded-[22px] border border-ink/10 bg-white p-6 shadow-[0_30px_70px_rgba(6,30,41,.14)] sm:p-9">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
