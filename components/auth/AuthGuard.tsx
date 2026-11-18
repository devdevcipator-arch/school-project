"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/auth/fields";
import { supabase } from "@/lib/supabase";

// Shows its children only to a signed-in user. Anyone else is sent to /login,
// which brings them back here (?next=) after they sign in.
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const toLogin = () => router.replace(`/login?next=${encodeURIComponent(pathname)}`);

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAllowed(true);
      else toLogin();
    });

    // Signing out in another tab (or the session expiring) ends access here too.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setAllowed(false);
        router.replace("/login");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, pathname]);

  if (!allowed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface text-primary" role="status" aria-label="Checking your session">
        <Spinner />
      </div>
    );
  }
  return <>{children}</>;
}
