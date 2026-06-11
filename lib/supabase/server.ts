import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database';

/**
 * Cookies-aware Supabase client for Server Components, Route Handlers, and
 * Server Actions. Reads and writes the auth session via Next's cookie store.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. The middleware refreshes the session, so this is safe
            // to ignore.
          }
        },
      },
    },
  );
}

/**
 * Server Supabase client authenticated by a Bearer access token instead of
 * cookies. The token is applied to every PostgREST request, so RLS evaluates
 * with the caller's `auth.uid()`. Used for facilitator API routes, which the
 * add-in calls without usable cookies.
 */
export function createClientWithToken(accessToken: string) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
}
