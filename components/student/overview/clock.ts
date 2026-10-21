import { useSyncExternalStore } from "react";

// The viewer's clock drives greeting, date and the live period, so it renders on the client only.
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
};

/** Minutes since midnight on the viewer's clock; -1 during server render. */
export function useMinuteOfDay() {
  return useSyncExternalStore(
    subscribe,
    () => {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    },
    () => -1,
  );
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** "13:30" -> "1:30 PM" */
export const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
