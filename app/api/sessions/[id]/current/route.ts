import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { participantCookieName } from '@/lib/participant';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/sessions/[id]/current — the participant's view of a session: its
// status plus every question with poll state and whether this participant has
// already answered. Identifies the participant via the join cookie.
//
// Sprint 3 surfaces all of the session's questions so responses can be
// exercised end-to-end. Sprint 5 (Presentation Controls) drives `poll_state`
// and the UI will then follow the single open question.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const sessionId = params.id;
  const participantId = cookies().get(participantCookieName(sessionId))?.value;

  if (!participantId) {
    return NextResponse.json({ error: 'Not joined.' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: participant } = await admin
    .from('participants')
    .select('id')
    .eq('id', participantId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ error: 'Not joined.' }, { status: 401 });
  }

  const { data: session } = await admin
    .from('sessions')
    .select('status')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  const { data: rows, error } = await admin
    .from('session_questions')
    .select('id, poll_state, launch_order, questions(type, prompt, config)')
    .eq('session_id', sessionId)
    .order('launch_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: answered } = await admin
    .from('responses')
    .select('session_question_id')
    .eq('participant_id', participantId);

  const answeredSet = new Set((answered ?? []).map((r) => r.session_question_id));

  const questions = (rows ?? [])
    .filter((row) => row.questions)
    .map((row) => ({
      sessionQuestionId: row.id,
      pollState: row.poll_state,
      type: row.questions!.type,
      prompt: row.questions!.prompt,
      config: row.questions!.config,
      answered: answeredSet.has(row.id),
    }));

  return NextResponse.json({ status: session.status, questions });
}
