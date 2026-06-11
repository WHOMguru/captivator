import 'server-only';

import { createClient, createClientWithToken } from './server';

type ServerClient = ReturnType<typeof createClient>;

/**
 * Authenticates a facilitator API request. Prefers the `Authorization: Bearer`
 * token (used by the add-in, where cookies don't survive the webview) and falls
 * back to the cookie session (normal browser use, e.g. /dashboard). Returns the
 * matching Supabase client plus the resolved user id (null when unauthenticated).
 */
export async function authenticateRequest(
  request: Request,
): Promise<{ supabase: ServerClient; userId: string | null }> {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (token) {
    const supabase = createClientWithToken(token);
    const { data } = await supabase.auth.getUser(token);
    return { supabase, userId: data.user?.id ?? null };
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}
