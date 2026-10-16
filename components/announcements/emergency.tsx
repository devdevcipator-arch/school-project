"use client";

import { useMemo, useSyncExternalStore } from "react";

// Front-end phase: the emergency banner lives in localStorage so every portal page
// (and other open tabs) picks it up. Backend phase: push it to all active sessions.
const KEY = "ss-emergency-banner";
const EVENT = "ss-emergency-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useEmergency() {
  return useSyncExternalStore(subscribe, () => localStorage.getItem(KEY), () => null);
}

export function setEmergency(message: string | null) {
  if (message) localStorage.setItem(KEY, message);
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

// Custom quick-select messages the principal saved for the broadcast form.
const PRESETS_KEY = "ss-emergency-presets";

function readPresets(raw: string | null): string[] {
  try {
    const list: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(list) ? list.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

function presetsSnapshot() {
  try {
    return localStorage.getItem(PRESETS_KEY);
  } catch {
    return null;
  }
}

export function useCustomPresets() {
  const raw = useSyncExternalStore(subscribe, presetsSnapshot, () => null);
  return useMemo(() => readPresets(raw), [raw]);
}

export function saveCustomPresets(list: string[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked (private mode): the preset just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Persistent red banner at the top of every portal page while an emergency is live. */
export function EmergencyBanner() {
  const message = useEmergency();
  if (!message) return null;
  return (
    <div role="alert" className="sticky top-16 z-20 bg-danger text-white shadow-[0_8px_24px_rgba(192,57,43,.35)] lg:top-0">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-[clamp(16px,3vw,36px)] py-3">
        <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-white/20">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-white/30" />
          <svg viewBox="0 0 24 24" aria-hidden className="relative size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 7v6 M12 17h.01" />
          </svg>
        </span>
        <p className="min-w-0 flex-1 text-[.92rem] font-semibold">
          <span className="mr-2 rounded-full bg-white/20 px-2 py-0.5 text-[.7rem] font-extrabold uppercase tracking-[.12em]">Emergency</span>
          {message}
        </p>
      </div>
    </div>
  );
}
