import type { Session } from '@supabase/supabase-js';

import { createClient } from './client';

// TEMPORARY facilitator-auth bootstrap (real login is the scheduled Sprint 6.5).
//
// The facilitator needs an authenticated session so RLS (owner_id = auth.uid())
// lets them read/write their own rows. The browser client persists the session
// in localStorage (see client.ts), so getSession() recovers it across reloads —
// we sign in anonymously only when there's genuinely no session. The shared
// `pendingSignIn` promise de-dupes the burst of sign-in calls components make on
// mount, which previously created many users and tripped the signup rate limit.
//
// Requires "Anonymous sign-ins" enabled in Supabase (Authentication → Providers).
let pendingSignIn: Promise<Session | null> | null = null;

async function currentSession(): Promise<Session | null> {
  const supabase = createClient();

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return data.session;
  }

  if (!pendingSignIn) {
    pendingSignIn = supabase.auth
      .signInAnonymously()
      .then(({ data: signedIn, error }) => (error ? null : signedIn.session));
  }
  const session = await pendingSignIn;
  pendingSignIn = null;
  return session;
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
