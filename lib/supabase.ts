import { createClient } from "@supabase/supabase-js";

// "Remember me": when on, the session lives in localStorage (survives closing the browser);
// when off, in sessionStorage (cleared when the browser closes).
const REMEMBER_KEY = "ss-remember";

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function setRememberMe(on: boolean) {
  safe(() => localStorage.setItem(REMEMBER_KEY, on ? "1" : "0"), undefined);
}

const remembered = () => safe(() => localStorage.getItem(REMEMBER_KEY) !== "0", true);

const sessionStore = {
  getItem: (key: string) => safe(() => localStorage.getItem(key) ?? sessionStorage.getItem(key), null),
  setItem: (key: string, value: string) =>
    safe(() => {
      const [keep, drop] = remembered() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      keep.setItem(key, value);
      drop.removeItem(key);
    }, undefined),
  removeItem: (key: string) =>
    safe(() => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }, undefined),
};

// Browser client. The publishable key is safe to expose; Row Level Security protects the data.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { storage: typeof window === "undefined" ? undefined : sessionStore } },
);
