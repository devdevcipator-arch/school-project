"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { subjectAccent, type Ext } from "@/lib/resources";

const extStyle: Record<Ext, string> = {
  pdf: "bg-primary text-surface",
  docx: "bg-accent text-white",
  pptx: "bg-[#b26b12] text-white",
  epub: "bg-ink text-surface",
};

/** Document thumbnail: a page shape with the extension badge. */
export function FileThumb({ ext, size = "md" }: { ext: Ext; size?: "sm" | "md" }) {
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-lg border border-ink/10 bg-white shadow-[inset_-3px_0_0_rgba(6,30,41,.06)] ${size === "sm" ? "h-11 w-9" : "h-14 w-11"}`} aria-hidden>
      <span className="absolute right-0 top-0 size-3 rounded-bl-md bg-ink/8" />
      <span className={`rounded px-1 py-px text-[.56rem] font-extrabold uppercase tracking-wide ${extStyle[ext]}`}>{ext}</span>
    </span>
  );
}

export function FolderGlyph({ subject, className = "size-12" }: { subject: string | null; className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl ${subjectAccent(subject)} ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-[55%]" fill="currentColor">
        <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4l2 2.5h7A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" opacity=".9" />
      </svg>
    </span>
  );
}

export type MenuItem = { label: string; icon: string; danger?: boolean; run: () => void };

/** 3-dots context menu; closes on outside click or Escape. */
export function KebabMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      window.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="grid size-9 cursor-pointer place-items-center rounded-lg text-ink/55 transition-colors hover:bg-primary/8 hover:text-primary"
      >
        <Icon d="M12 5h.01 M12 12h.01 M12 19h.01" className="size-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+4px)] z-30 w-[230px] animate-fade-in rounded-2xl border border-ink/10 bg-white p-1.5 shadow-[0_20px_50px_rgba(6,30,41,.16)]">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.run();
              }}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[.86rem] font-semibold transition-colors ${it.danger ? "text-danger hover:bg-danger/8" : "text-ink/75 hover:bg-primary/6 hover:text-primary"}`}
            >
              <Icon d={it.icon} className="size-4 shrink-0" />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const icons = {
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  download: "M12 4v11 M7 10l5 5 5-5 M5 20h14",
  edit: "M4 20h4L19 9l-4-4L4 16z M14 6l4 4",
  trash: "M5 7h14 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3",
  tag: "M3 12V4h8l10 10-8 8z M7.5 7.5h.01",
  upload: "M12 16V4 M7 9l5-5 5 5 M5 20h14",
  folderPlus: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M12 11v6 M9 14h6",
  home: "M3 11l9-7 9 7 M5 10v10h14V10",
};
