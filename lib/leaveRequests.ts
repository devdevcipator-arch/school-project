// Teacher leave requests: sent from the teacher Leave page, reviewed on the principal's Leave Requests page.
// Front-end only: kept in this browser's storage so both portals see the same list. Replace with the API in the backend phase.

import { useSyncExternalStore } from "react";

export type LeaveStatus = "Pending" | "Approved" | "Declined";

export type LeaveRequest = {
  id: string;
  teacher: string;
  /** ISO date the request was sent. */
  sent: string;
  reason: string;
  status: LeaveStatus;
};

const seed: LeaveRequest[] = [
  { id: "lv3", teacher: "Hina Javed", sent: "2026-10-23", reason: "My sister's wedding is on 29 and 30 October, so I need both days off.", status: "Pending" },
  { id: "lv2", teacher: "Usman Tariq", sent: "2026-10-21", reason: "Doctor's appointment on Monday morning. I will be back after the second period.", status: "Approved" },
  { id: "lv1", teacher: "Fatima Noor", sent: "2026-10-14", reason: "Family emergency, need to travel to Multan for two days.", status: "Approved" },
];

const KEY = "leave-requests";
const listeners = new Set<() => void>();
let cache: LeaveRequest[] | null = null;

const read = (): LeaveRequest[] => {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as LeaveRequest[]) : seed;
  } catch {
    cache = seed;
  }
  return cache;
};

const write = (next: LeaveRequest[]) => {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  // Another tab (e.g. the teacher portal) sent or updated a request.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

export const useLeaveRequests = () => useSyncExternalStore(subscribe, read, () => seed);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const sendLeaveRequest = (teacher: string, reason: string) =>
  write([{ id: `lv${Date.now().toString(36)}`, teacher, sent: today(), reason, status: "Pending" }, ...read()]);

export const setLeaveStatus = (id: string, status: LeaveStatus) => write(read().map((r) => (r.id === id ? { ...r, status } : r)));
