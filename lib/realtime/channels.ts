// Single source of truth for Supabase Realtime channel names. Never hand-write
// channel strings elsewhere — import these helpers so producers and consumers
// always agree.

/** Channel scoped to a whole session (lifecycle, poll-state changes). */
export function sessionChannel(sessionId: string): string {
  return `session:${sessionId}`;
}

/** Channel scoped to a single session question (its incoming responses). */
export function questionChannel(sessionQuestionId: string): string {
  return `question:${sessionQuestionId}`;
}
