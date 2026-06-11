import { createClient } from './client';

// TEMPORARY facilitator-auth bootstrap.
//
// Sprint 1 needs an authenticated user so RLS (owner_id = auth.uid()) lets the
// facilitator create and read their own questions, but the sprint sequence has
// no login surface yet. Until a real facilitator sign-in lands, we establish an
// anonymous Supabase session so the @supabase/ssr cookie carries auth.uid() to
// the API routes.
//
// Requires "Anonymous sign-ins" to be enabled in the Supabase project
// (Authentication → Providers). Swap this for real auth in a later sprint.
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
