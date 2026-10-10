import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { mainNav, portals, site } from "@/lib/site";

const heading = "mb-[18px] text-[.85rem] font-bold uppercase tracking-[.12em] text-accent";
const footLink =
  "text-[.95rem] text-surface/80 bg-[linear-gradient(var(--color-accent),var(--color-accent))] bg-no-repeat bg-[position:0_100%] bg-[length:0_1px] transition-[background-size,color] duration-[400ms] ease-nav hover:bg-[length:100%_1px] hover:text-surface";

export default function Footer() {
  return (
    <footer className="bg-ink pt-[72px] text-surface">
      <div className="shell grid gap-10 pb-[52px] sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
        <div data-reveal>
          <Logo />
          <p className="mt-[18px] max-w-[380px] text-[.93rem] text-surface/80">
            A paperless school management system that connects Principals, Teachers and Students with attendance
            tracking, targeted announcements, AI-generated assessments and digital report cards.
          </p>
        </div>

        <div data-reveal>
          <h4 className={heading}>Navigation</h4>
          <ul className="grid gap-3">
            {mainNav.map((l) => (
              <li key={l.href}><Link href={l.href} className={footLink}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div data-reveal>
          <h4 className={heading}>Portals</h4>
          <ul className="grid gap-3">
            {portals.map((l) => (
              <li key={l.href}><Link href={l.href} className={footLink}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div data-reveal>
          <h4 className={heading}>Contact</h4>
          <ul className="grid gap-3 text-[.93rem] text-surface/80">
            <li className="grid">
              <span className="text-xs font-bold uppercase tracking-[.08em] text-surface">Email</span>
              <a href={`mailto:${site.email}`} className={footLink}>{site.email}</a>
            </li>
            <li className="grid">
              <span className="text-xs font-bold uppercase tracking-[.08em] text-surface">Phone</span>
              <a href={site.phoneHref} className={footLink}>{site.phone}</a>
            </li>
            <li className="grid">
              <span className="text-xs font-bold uppercase tracking-[.08em] text-surface">Office</span>
              {site.address}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-surface/10 py-[22px] text-[.87rem] text-surface/80">
        <div className="shell">
          <p>© {site.copyrightYear} {site.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
