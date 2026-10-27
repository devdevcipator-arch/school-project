"use client";

import { useEffect } from "react";

const PICKER_TYPES = new Set(["date", "time", "datetime-local", "month", "week"]);

/**
 * Platform-wide: clicking anywhere on a date/time input opens its native picker,
 * not just the calendar icon. One delegated listener covers every field.
 */
export default function PickerOnClick() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement) || !PICKER_TYPES.has(el.type)) return;
      if (el.disabled || el.readOnly) return;
      try {
        el.showPicker();
      } catch {
        // Unsupported browser or picker already open: fall back to default behavior.
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
