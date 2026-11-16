// Student's own account (name shown across the student portal).
// Front-end phase: the name is kept in this browser; replace with the account API in the backend phase.

import { useSyncExternalStore } from "react";
import { student } from "./student";
import { emailFor } from "./teachers";

const KEY = "student-account-name";
const EVENT = "student-account-change";

/** Sign-in email issued by the school (read only for the student). */
export const studentEmail = emailFor(student.name);

function read() {
  try {
    return localStorage.getItem(KEY) || student.name;
  } catch {
    return student.name;
  }
}

export function saveStudentName(name: string) {
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

/** The student's current display name, kept in sync everywhere it is shown. */
export function useStudentName() {
  return useSyncExternalStore(subscribe, read, () => student.name);
}
