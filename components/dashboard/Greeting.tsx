"use client";

import { useSyncExternalStore } from "react";

// Date and greeting come from the viewer's clock, so they render on the client only.
const noop = () => () => {};
function useToday() {
  // Snapshot must be a primitive so React sees a stable value between renders.
  const snap = useSyncExternalStore(
    noop,
    () => {
      const now = new Date();
      const h = now.getHours();
      const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
      return `${greeting}|${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
    },
    () => "",
  );
  if (!snap) return null;
  const [greeting, date] = snap.split("|");
  return { greeting, date };
}

/** Top-bar greeting shown at the top left of every portal page, beside the profile card. */
export default function Greeting({ name }: { name: string }) {
  const today = useToday();
  return (
    <div className="min-w-0">
      <p className="text-[.8rem] font-semibold text-ink/55 sm:text-[.88rem]">{today?.date ?? " "}</p>
      <p className="mt-0.5 text-[clamp(1.15rem,2.4vw,2.1rem)] font-extrabold leading-tight tracking-tight">
        {today?.greeting ?? "Welcome"}, {name}
      </p>
    </div>
  );
}
