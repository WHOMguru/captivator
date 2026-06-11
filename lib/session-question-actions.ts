import 'server-only';

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/supabase/request-auth';
import type { PollState } from '@/types/database';

export type PollAction = 'launch' | 'close' | 'reveal' | 'hide';

type ServerClient = ReturnType<typeof createClient>;

// Applies a presenter action. Returns the updated row, or null when the question
// isn't found / not owned (RLS). Launch enforces a single open question per
// session by closing any other open one.
async function apply(supabase: ServerClient, id: string, action: PollAction) {
  if (action === 'launch') {
    const { data: sq } = await supabase
      .from('session_questions')
      .select('session_id')
      .eq('id', id)
      .maybeSingle();
    if (!sq) return null;

    await supabase
      .from('session_questions')
      .update({ poll_state: 'closed' as PollState })
      .eq('session_id', sq.session_id)
      .eq('poll_state', 'open')
      .neq('id', id);

    const { data } = await supabase
      .from('session_questions')
      .update({ poll_state: 'open' as PollState })
      .eq('id', id)
      .select('id, poll_state, results_revealed')
      .maybeSingle();
    return data;
  }

  const patch =
    action === 'close'
      ? { poll_state: 'closed' as PollState }
      : action === 'reveal'
        ? { results_revealed: true }
        : { results_revealed: false };

  const { data } = await supabase
    .from('session_questions')
    .update(patch)
    .eq('id', id)
    .select('id, poll_state, results_revealed')
    .maybeSingle();
  return data;
}

// Builds the PATCH handler for a presenter action route. RLS ensures only the
// owning facilitator can change the row.
export function makePollActionRoute(action: PollAction) {
  return async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const { supabase, userId } = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const data = await apply(supabase, params.id, action);
    if (!data) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }
    return NextResponse.json(data);
  };
}
