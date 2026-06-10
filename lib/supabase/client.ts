import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

/**
 * Browser-side Supabase client. Safe to call from Client Components — it only
 * uses the public anon key. Never import the service-role key here.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
