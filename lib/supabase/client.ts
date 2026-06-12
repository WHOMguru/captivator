import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

let client: ReturnType<typeof createSupabaseClient<Database>> | undefined;

/**
 * Browser-side Supabase client — a memoized singleton that persists auth in
 * localStorage.
 *
 * We deliberately use plain supabase-js (not @supabase/ssr's cookie-based
 * client): facilitator API auth is Bearer-token based (see lib/api.ts), and the
 * PowerPoint add-in webview drops cookies. localStorage works in the webview, so
 * the anonymous session survives task-pane reloads and we sign in once instead
 * of on every load — which previously tripped Supabase's signup rate limit.
 *
 * Only uses the public anon key; never import the service-role key here.
 */
export function createClient() {
  if (!client) {
    client = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'captivator-facilitator-auth',
        },
      },
    );
  }
  return client;
}
