import { createClient } from "@supabase/supabase-js";

// Browser client. The publishable key is safe to expose; Row Level Security protects the data.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
