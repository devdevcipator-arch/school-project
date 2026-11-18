"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Sidebar footer button: ends the Supabase session, then returns to /login.
export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="flex w-full cursor-pointer items-center gap-3 rounded-full px-4 py-[11px] text-left text-[.92rem] font-semibold text-surface/70 transition-colors hover:bg-surface/10 hover:text-surface disabled:cursor-wait disabled:opacity-70"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-[19px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10" />
      </svg>
      {busy ? "Logging out..." : "Log out"}
    </button>
  );
}
