import { createClient } from "@supabase/supabase-js";

// Must be literal process.env.NEXT_PUBLIC_* references so Next inlines them into the browser bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
  );
}

export const supabase = createClient(url, key);

export type Calc = {
  id: number | string;
  expression: string;
  result: string;
  created_at: string;
};
