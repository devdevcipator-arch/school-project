"use client";

import { useMemo, useSyncExternalStore } from "react";
import { notices as seed, type Notice } from "@/lib/announcements";

// Front-end phase: the principal's notices live in localStorage so the student portal (and other
// open tabs) shows exactly what was published. Backend phase: replace with the notices API.
const KEY = "ss-notices-v1";
const EVENT = "ss-notices-change";

// Fallback when storage is blocked (private mode): changes still apply for this page session.
let memory: string | null = null;

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function snapshot() {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function parse(raw: string | null): Notice[] {
  if (raw === null) return seed;
  try {
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? (list as Notice[]) : seed;
  } catch {
    return seed;
  }
}

/** Current notice list; the seeded mock until the principal changes something. */
export function useNoticeList() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  return useMemo(() => parse(raw), [raw]);
}

export const readNotices = () => parse(snapshot());

export function saveNotices(list: Notice[]) {
  const raw = JSON.stringify(list);
  memory = raw;
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // Storage blocked: `memory` keeps the change for this session.
  }
  window.dispatchEvent(new Event(EVENT));
}
