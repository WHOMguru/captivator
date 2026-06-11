// Per-session participant cookie. Set httpOnly at join, read by the participant
// API routes to identify the (anonymous) participant without a Supabase Auth
// session. Scoped per session so one browser can join several sessions.
export function participantCookieName(sessionId: string): string {
  return `cap_p_${sessionId}`;
}

export const PARTICIPANT_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours
