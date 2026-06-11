import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { participantCookieName } from '@/lib/participant';
import {
  multipleChoiceConfigSchema,
  rankingConfigSchema,
  type QuestionType,
} from '@/lib/schemas/question';
import {
  bordaRanking,
  openTextFeed,
  tallyMultipleChoice,
  tallyWords,
  type ResponseRow,
} from '@/lib/results/aggregate';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/sessions/[id]/current — the participant's live view, driven by
// poll_state (Sprint 5): the single open question to answer, plus any questions
// whose results the facilitator has revealed. Identifies the participant via the
// join cookie.
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

  const { data: rows } = await admin
    .from('session_questions')
    .select('id, poll_state, results_revealed, launch_order, questions(type, prompt, config)')
    .eq('session_id', sessionId)
    .order('launch_order', { ascending: true });

  const questionRows = (rows ?? []).filter((row) => row.questions);

  const { data: answered } = await admin
    .from('responses')
    .select('session_question_id')
    .eq('participant_id', participantId);
  const answeredSet = new Set((answered ?? []).map((r) => r.session_question_id));

  // Open question to answer (lowest launch_order wins via ordering above).
  const openRow = questionRows.find((row) => row.poll_state === 'open');
  const open = openRow
    ? {
        sessionQuestionId: openRow.id,
        type: openRow.questions!.type,
        prompt: openRow.questions!.prompt,
        config: openRow.questions!.config,
        answered: answeredSet.has(openRow.id),
      }
    : null;

  // Revealed results, aggregated server-side (participants have no DB access).
  const revealedRows = questionRows.filter((row) => row.results_revealed);
  let revealed: unknown[] = [];

  if (revealedRows.length > 0) {
    const ids = revealedRows.map((row) => row.id);
    const { data: responseRows } = await admin
      .from('responses')
      .select('id, session_question_id, payload, submitted_at')
      .in('session_question_id', ids);

    const byQuestion = new Map<string, ResponseRow[]>();
    for (const r of responseRows ?? []) {
      const list = byQuestion.get(r.session_question_id) ?? [];
      list.push({ id: r.id, payload: r.payload, submitted_at: r.submitted_at });
      byQuestion.set(r.session_question_id, list);
    }

    revealed = revealedRows.map((row) => {
      const type = row.questions!.type as QuestionType;
      const list = byQuestion.get(row.id) ?? [];
      const base = { sessionQuestionId: row.id, type, prompt: row.questions!.prompt };

      if (type === 'open_text') {
        return { ...base, feed: openTextFeed(list) };
      }
      if (type === 'multiple_choice') {
        const options = multipleChoiceConfigSchema.safeParse(row.questions!.config);
        return {
          ...base,
          tally: tallyMultipleChoice(options.success ? options.data.options : [], list),
        };
      }
      if (type === 'ranking') {
        const items = rankingConfigSchema.safeParse(row.questions!.config);
        return { ...base, tally: bordaRanking(items.success ? items.data.items : [], list) };
      }
      return { ...base, tally: tallyWords(list) };
    });
  }

  return NextResponse.json({ status: session.status, open, revealed });
}
