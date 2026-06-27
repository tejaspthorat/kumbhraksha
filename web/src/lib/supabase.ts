import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set. Supabase client will not be available."
  );
}

// 1. Existing public client for unauthenticated or non-RLS operations
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * 2. Specialized Clerk integration for Supabase RLS (Row Level Security).
 * Call this function passing the Clerk JWT (from auth().getToken({ template: 'supabase' }))
 * to create a client that acts on behalf of the Clerk user in Supabase.
 */
export const createClerkSupabaseClient = (clerkToken: string) => {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  });
};