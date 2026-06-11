import { NextResponse } from 'next/server';

import { authenticateRequest } from '@/lib/supabase/request-auth';

// DELETE /api/session-questions/[id] — detach a poll from its session. RLS limits
// this to the owning facilitator.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { supabase, userId } = await authenticateRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { error } = await supabase.from('session_questions').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
