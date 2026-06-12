import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/supabase/request-auth';

// POST /api/sessions/[id]/reset — testing helper. Clears the session's
// participants (responses cascade) and resets every attached poll to pending /
// results hidden, keeping the session active with the same code so it can be
// re-run immediately.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { supabase, userId } = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // Ownership check via RLS — returns the row only if this facilitator owns it.
  const { data: owned } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();
  if (!owned) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  const admin = createAdminClient();

  // Deleting participants cascades to their responses.
  const { error: pErr } = await admin.from('participants').delete().eq('session_id', params.id);
  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const { error: sqErr } = await admin
    .from('session_questions')
    .update({ poll_state: 'pending', results_revealed: false })
    .eq('session_id', params.id);
  if (sqErr) {
    return NextResponse.json({ error: sqErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
