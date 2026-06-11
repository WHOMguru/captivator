import { getAccessToken } from '@/lib/supabase/ensure-session';

/**
 * fetch() for facilitator API routes. Attaches the anonymous session's access
 * token as a Bearer header so the server can authenticate without cookies
 * (which the PowerPoint add-in webview drops), and disables HTTP caching so
 * lists reflect writes immediately (the webview caches GETs aggressively).
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { cache: 'no-store', ...init, headers });
}
