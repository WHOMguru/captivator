import { NextResponse } from 'next/server';

import { authenticateRequest } from '@/lib/supabase/request-auth';

// PATCH /api/sessions/[id]/end — move a session to ended. RLS limits this to the
// owning facilitator.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, userId } = await authenticateRequest(request);

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id, status, session_code, ended_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  return NextResponse.json(data);
}
