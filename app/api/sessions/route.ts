import { NextResponse } from 'next/server';

import { createSessionSchema, generateSessionCode } from '@/lib/schemas/session';
import { authenticateRequest } from '@/lib/supabase/request-auth';
import { getOrCreateDefaultWorkshopId } from '@/lib/workshops';

const MAX_CODE_ATTEMPTS = 6;

// GET /api/sessions — the facilitator's sessions, newest first, with a question count.
export async function GET(request: Request) {
  const { supabase, userId } = await authenticateRequest(request);

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('id, session_code, status, started_at, ended_at, created_at, session_questions(count)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sessions = (data ?? []).map((s) => ({
    id: s.id,
    session_code: s.session_code,
    status: s.status,
    started_at: s.started_at,
    ended_at: s.ended_at,
    created_at: s.created_at,
    question_count: s.session_questions[0]?.count ?? 0,
  }));

  return NextResponse.json({ sessions });
}

// POST /api/sessions — create a draft session from selected questions.
export async function POST(request: Request) {
  const { supabase, userId } = await authenticateRequest(request);

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const parsed = createSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid session.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const workshopId = await getOrCreateDefaultWorkshopId(supabase, userId);

  // Keep only questions that actually belong to this facilitator's workshop,
  // preserving the requested order.
  const { data: owned, error: ownedError } = await supabase
    .from('questions')
    .select('id')
    .eq('workshop_id', workshopId)
    .in('id', parsed.data.questionIds);

  if (ownedError) {
    return NextResponse.json({ error: ownedError.message }, { status: 500 });
  }

  const ownedIds = new Set((owned ?? []).map((q) => q.id));
  const questionIds = parsed.data.questionIds.filter((id) => ownedIds.has(id));
  if (questionIds.length === 0) {
    return NextResponse.json(
      { error: 'None of the selected questions were found.' },
      { status: 400 },
    );
  }

  // Insert the session, retrying on the rare session_code collision.
  let sessionId: string | null = null;
  let sessionCode = '';
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    sessionCode = generateSessionCode();
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ workshop_id: workshopId, session_code: sessionCode })
      .select('id')
      .single();

    if (!error && session) {
      sessionId = session.id;
      break;
    }
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Could not allocate a unique session code. Try again.' },
      { status: 503 },
    );
  }

  const rows = questionIds.map((questionId, index) => ({
    session_id: sessionId as string,
    question_id: questionId,
    launch_order: index,
  }));

  const { error: linkError } = await supabase.from('session_questions').insert(rows);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: sessionId, session_code: sessionCode, status: 'draft' },
    { status: 201 },
  );
}
