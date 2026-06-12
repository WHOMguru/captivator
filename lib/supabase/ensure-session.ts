import type { Session } from '@supabase/supabase-js';

import { createClient } from './client';

// TEMPORARY facilitator-auth bootstrap (real login is the scheduled Sprint 6.5).
//
// The facilitator needs an authenticated session so RLS (owner_id = auth.uid())
// lets them read/write their own rows. The PowerPoint add-in webview blocks
// cookie storage, so supabase's own getSession() can't recover a session — which
// means every auth call would trigger a fresh signInAnonymously(). That created
// many anonymous users and tripped Supabase's signup rate limit, so some
// requests got a token and others got throttled to none (intermittent 401s).
//
// Fix: sign in once per page load and cache the session in memory. Every caller
// reuses it, so there's a single stable anonymous user and token. (Persistence
// across task-pane reloads still needs real auth — Sprint 6.5.)
//
// Requires "Anonymous sign-ins" enabled in Supabase (Authentication → Providers).
let cachedSession: Session | null = null;
let pending: Promise<Session | null> | null = null;

async function currentSession(): Promise<Session | null> {
  if (cachedSession) {
    return cachedSession;
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    cachedSession = data.session;
    return cachedSession;
  }

  if (!pending) {
    pending = supabase.auth
      .signInAnonymously()
      .then(({ data: signedIn, error }) => (error ? null : signedIn.session));
  }
  cachedSession = await pending;
  pending = null;
  return cachedSession;
}

export async function ensureSession(): Promise<string | null> {
  const session = await currentSession();
  return session?.user.id ?? null;
}

/**
 * Returns the current access token, signing in anonymously once if needed. Used
 * to attach `Authorization: Bearer <token>` to API requests.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await currentSession();
  return session?.access_token ?? null;
}
