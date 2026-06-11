import 'server-only';

import { createClient } from '@/lib/supabase/server';

type ServerClient = ReturnType<typeof createClient>;

/**
 * Attaches questions to a session, appending after any already attached and
 * skipping duplicates. Only questions in the session's own workshop are added,
 * so ownership is enforced. Returns an error message, or null on success.
 * Works whether the session is draft or active, so polls can be added live.
 */
export async function attachQuestionsToSession(
  supabase: ServerClient,
  sessionId: string,
  questionIds: string[],
): Promise<string | null> {
  if (questionIds.length === 0) return null;

  const { data: session } = await supabase
    .from('sessions')
    .select('workshop_id')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return 'Session not found.';

  const { data: owned } = await supabase
    .from('questions')
    .select('id')
    .eq('workshop_id', session.workshop_id)
    .in('id', questionIds);
  const ownedIds = new Set((owned ?? []).map((q) => q.id));

  const { data: existing } = await supabase
    .from('session_questions')
    .select('question_id, launch_order')
    .eq('session_id', sessionId);
  const attached = new Set((existing ?? []).map((e) => e.question_id));
  let nextOrder = (existing ?? []).reduce((max, e) => Math.max(max, e.launch_order), -1) + 1;

  const rows = questionIds
    .filter((id) => ownedIds.has(id) && !attached.has(id))
    .map((questionId) => ({
      session_id: sessionId,
      question_id: questionId,
      launch_order: nextOrder++,
    }));

  if (rows.length === 0) return null;

  const { error } = await supabase.from('session_questions').insert(rows);
  return error ? error.message : null;
}
