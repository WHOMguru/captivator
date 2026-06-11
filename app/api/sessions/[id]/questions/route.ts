import { NextResponse } from 'next/server';

import { attachQuestionsSchema } from '@/lib/schemas/session';
import { attachQuestionsToSession } from '@/lib/session-questions-attach';
import { authenticateRequest } from '@/lib/supabase/request-auth';

type RouteContext = { params: { id: string } };

// GET /api/sessions/[id]/questions — polls currently attached to a session.
export async function GET(request: Request, { params }: RouteContext) {
  const { supabase, userId } = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('session_questions')
    .select('id, question_id, launch_order, questions(prompt, type)')
    .eq('session_id', params.id)
    .order('launch_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const questions = (data ?? [])
    .filter((row) => row.questions)
    .map((row) => ({
      sessionQuestionId: row.id,
      questionId: row.question_id,
      prompt: row.questions!.prompt,
      type: row.questions!.type,
    }));

  return NextResponse.json({ questions });
}

// POST /api/sessions/[id]/questions — attach polls to a session (append, skip
// duplicates). Works on draft or active sessions.
export async function POST(request: Request, { params }: RouteContext) {
  const { supabase, userId } = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const parsed = attachQuestionsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const attachError = await attachQuestionsToSession(supabase, params.id, parsed.data.questionIds);
  if (attachError) {
    return NextResponse.json({ error: attachError }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
