// Shared line icons (24x24, stroke = currentColor)
export const iconPaths = {
  chart: "M4 19V5 M4 19h16 M8 15l3-4 3 2 5-6",
  star: "M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z",
  cap: "M3 9l9-5 9 5-9 5z M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5",
  doc: "M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6",
  megaphone: "M3 11l15-6v14L3 13z M7 13v5h3v-4",
  clock: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2",
  check: "M4 12l5 5L20 6",
  users: "M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7 M16 3.5a4 4 0 0 1 0 7.5 M18 14c2.4.8 4 3.2 4 7",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0",
  download: "M12 4v11 M7 10l5 5 5-5 M5 20h14",
  quiz: "M9 4h6 M8 4H6v17h12V4h-2 M9 10h6 M9 14h6 M9 18h3",
  school: "M3 21h18 M5 21V10l7-5 7 5v11 M10 21v-5h4v5 M12 9v2",
  spark: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6",
};

export function Icon({ d, className = "size-6" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
