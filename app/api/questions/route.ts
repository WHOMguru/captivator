import { NextResponse } from 'next/server';

import { createQuestionSchema } from '@/lib/schemas/question';
import { attachQuestionsToSession } from '@/lib/session-questions-attach';
import { authenticateRequest } from '@/lib/supabase/request-auth';
import { getOrCreateDefaultWorkshopId } from '@/lib/workshops';
import type { Json } from '@/types/database';

// GET /api/questions — list the current facilitator's questions (with any
// slide link) for their default workshop.
export async function GET(request: Request) {
  const { supabase, userId } = await authenticateRequest(request);

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const workshopId = await getOrCreateDefaultWorkshopId(supabase, userId);

  const { data, error } = await supabase
    .from('questions')
    .select('id, type, prompt, config, created_at, slide_links(slide_id, deck_id)')
    .eq('workshop_id', workshopId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data });
}

// POST /api/questions — create a question, plus a slide link when a slide was
// selected in PowerPoint.
export async function POST(request: Request) {
  const { supabase, userId } = await authenticateRequest(request);

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const parsed = createQuestionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid question.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const payload = parsed.data;

  const workshopId = await getOrCreateDefaultWorkshopId(supabase, userId);

  const { data: question, error: insertError } = await supabase
    .from('questions')
    .insert({
      workshop_id: workshopId,
      type: payload.type,
      prompt: payload.prompt,
      config: payload.config as unknown as Json,
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (payload.slideId) {
    const { error: linkError } = await supabase.from('slide_links').insert({
      question_id: question.id,
      slide_id: payload.slideId,
      deck_id: payload.deckId ?? null,
    });
    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }
  }

  // Seamless flow: if a session is live, attach the new poll to it automatically
  // so it's ready to present. Best-effort — never fail poll creation over this.
  const { data: activeSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (activeSession) {
    await attachQuestionsToSession(supabase, activeSession.id, [question.id]);
  }

  return NextResponse.json({ id: question.id }, { status: 201 });
}
