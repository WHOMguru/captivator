import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  multipleChoiceConfigSchema,
  openTextConfigSchema,
  rankingConfigSchema,
  wordCloudConfigSchema,
  type QuestionType,
} from '@/lib/schemas/question';
import { responseSchemaFor } from '@/lib/schemas/response';
import { participantCookieName } from '@/lib/participant';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';

const bodySchema = z.object({
  sessionQuestionId: z.string().uuid(),
  payload: z.unknown(),
});

// Cross-checks a (schema-valid) payload against the question's stored config.
// Returns an error message, or null when the answer is acceptable.
function checkAgainstConfig(
  type: QuestionType,
  config: unknown,
  payload: Record<string, unknown>,
): string | null {
  switch (type) {
    case 'multiple_choice': {
      const c = multipleChoiceConfigSchema.parse(config);
      const selected = payload.selected as string[];
      if (!selected.every((s) => c.options.includes(s))) {
        return 'Selection is not among the options.';
      }
      if (!c.allowMultiple && selected.length > 1) {
        return 'Only one option may be selected.';
      }
      return null;
    }
    case 'word_cloud': {
      const c = wordCloudConfigSchema.parse(config);
      const words = payload.words as string[];
      if (words.length > c.maxEntries) {
        return `Up to ${c.maxEntries} words.`;
      }
      return null;
    }
    case 'open_text': {
      const c = openTextConfigSchema.parse(config);
      const text = payload.text as string;
      if (text.length > c.maxLength) {
        return `Keep it under ${c.maxLength} characters.`;
      }
      return null;
    }
    case 'ranking': {
      const c = rankingConfigSchema.parse(config);
      const order = payload.order as string[];
      const sameLength = order.length === c.items.length;
      const sameSet = sameLength && [...order].sort().join('|') === [...c.items].sort().join('|');
      if (!sameSet) {
        return 'Ranking must include every item exactly once.';
      }
      return null;
    }
  }
}

// POST /api/responses — record a participant's answer. Verifies the join cookie,
// an active session, and the payload (schema + config) before upserting.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: sq } = await admin
    .from('session_questions')
    .select('id, session_id, questions(type, config), sessions(status)')
    .eq('id', parsed.data.sessionQuestionId)
    .maybeSingle();

  if (!sq || !sq.questions || !sq.sessions) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
  }

  const participantId = cookies().get(participantCookieName(sq.session_id))?.value;
  if (!participantId) {
    return NextResponse.json({ error: 'Not joined.' }, { status: 401 });
  }

  const { data: participant } = await admin
    .from('participants')
    .select('id')
    .eq('id', participantId)
    .eq('session_id', sq.session_id)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ error: 'Not joined.' }, { status: 401 });
  }

  if (sq.sessions.status !== 'active') {
    return NextResponse.json({ error: 'This session is not active.' }, { status: 409 });
  }

  const type = sq.questions.type;
  const schema = responseSchemaFor(type);
  const payloadResult = schema.safeParse(parsed.data.payload);
  if (!payloadResult.success) {
    return NextResponse.json(
      { error: 'Invalid answer.', issues: payloadResult.error.flatten() },
      { status: 400 },
    );
  }

  const configError = checkAgainstConfig(
    type,
    sq.questions.config,
    payloadResult.data as Record<string, unknown>,
  );
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 400 });
  }

  const { error: upsertError } = await admin.from('responses').upsert(
    {
      session_question_id: parsed.data.sessionQuestionId,
      participant_id: participantId,
      payload: payloadResult.data as unknown as Json,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'session_question_id,participant_id' },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
