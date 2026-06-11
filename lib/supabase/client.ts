import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Browser-side Supabase client — a memoized singleton. One shared instance keeps
 * the in-memory (anonymous) session consistent across every component, which
 * matters inside the PowerPoint add-in webview where cookie storage is
 * unreliable. Only uses the public anon key; never import the service-role key
 * here.
 */
export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
