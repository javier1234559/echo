import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/config";

// RLS is disabled on all tables, so the publishable key has full access
export const supabase = createClient(
  supabaseConfig.URL,
  supabaseConfig.PUBLISHABLE_KEY,
);
