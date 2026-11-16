// Principal's own account (name shown across the portal).
// Front-end phase: the name is kept in this browser; replace with the account API in the backend phase.

import { useSyncExternalStore } from "react";
import { principal } from "./principal";

const KEY = "principal-account-name";
const EVENT = "principal-account-change";

function read() {
  try {
    return localStorage.getItem(KEY) || principal.name;
  } catch {
    return principal.name;
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(KEY, name);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** The principal's current display name, kept in sync everywhere it is shown. */
export function usePrincipalName() {
  return useSyncExternalStore(subscribe, read, () => principal.name);
}

/** Two-letter initials, ignoring titles like "Dr." or "Mr.". */
export function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter((w) => w && !/^(dr|mr|mrs|ms|prof)\.?$/i.test(w));
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}
