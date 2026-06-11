import { createClient } from './client';

// TEMPORARY facilitator-auth bootstrap.
//
// The facilitator needs an authenticated session so RLS (owner_id = auth.uid())
// lets them read/write their own rows, but the sprint sequence has no login
// surface yet (real login is the scheduled Sprint 6.5). We establish an
// anonymous Supabase session and authenticate the API routes with its access
// token (see lib/api.ts + lib/supabase/request-auth.ts) — cookies are
// unreliable inside the Office add-in webview, so we don't depend on them.
//
// Requires "Anonymous sign-ins" enabled in Supabase (Authentication → Providers).
export async function ensureSession(): Promise<string | null> {
  const supabase = createClient();

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return data.session.user.id;
  }

  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return null;
  }
  return signedIn.user?.id ?? null;
}

/**
 * Returns the current access token, signing in anonymously if needed. Used to
 * attach `Authorization: Bearer <token>` to API requests.
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();

  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return data.session.access_token;
  }

  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return null;
  }
  return signedIn.session?.access_token ?? null;
}
