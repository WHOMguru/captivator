import { NextResponse } from 'next/server';

import { createQuestionSchema } from '@/lib/schemas/question';
import { authenticateRequest } from '@/lib/supabase/request-auth';
import type { Json } from '@/types/database';

type RouteContext = { params: { id: string } };

// PATCH /api/questions/[id] — update a question and reconcile its slide link.
// RLS guarantees the row belongs to the calling facilitator.
export async function PATCH(request: Request, { params }: RouteContext) {
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

  const { data: updated, error: updateError } = await supabase
    .from('questions')
    .update({
      type: payload.type,
      prompt: payload.prompt,
      config: payload.config as unknown as Json,
    })
    .eq('id', params.id)
    .select('id')
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
  }

  // Reconcile the single slide link: upsert when a slide is selected, clear it
  // otherwise.
  if (payload.slideId) {
    const { error: linkError } = await supabase.from('slide_links').upsert(
      {
        question_id: params.id,
        slide_id: payload.slideId,
        deck_id: payload.deckId ?? null,
      },
      { onConflict: 'question_id' },
    );
    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }
  } else {
    const { error: clearError } = await supabase
      .from('slide_links')
      .delete()
      .eq('question_id', params.id);
    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: params.id });
}

// DELETE /api/questions/[id] — remove a question (slide link cascades).
export async function DELETE(request: Request, { params }: RouteContext) {
  const { supabase, userId } = await authenticateRequest(request);

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { error } = await supabase.from('questions').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
