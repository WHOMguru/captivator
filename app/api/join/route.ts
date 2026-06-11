import { NextResponse } from 'next/server';
import { z } from 'zod';

import { PARTICIPANT_COOKIE_MAX_AGE, participantCookieName } from '@/lib/participant';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const joinSchema = z.object({
  code: z.string().trim().min(1),
  displayName: z.string().trim().min(1).max(60).optional(),
});

// POST /api/join — resolve an active session by code, create an anonymous
// participant, and drop an httpOnly join cookie. Returns the session id so the
// client can route to /session/[id].
export async function POST(request: Request) {
  const parsed = joinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid join request.' }, { status: 400 });
  }

  // check_session_code is SECURITY DEFINER and returns the session only when
  // active — safe to call as the anonymous role.
  const supabase = createClient();
  const { data, error } = await supabase.rpc('check_session_code', {
    code: parsed.data.code,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const session = data?.[0];
  if (!session) {
    return NextResponse.json(
      { error: "That session isn't active. Check the code with your facilitator." },
      { status: 404 },
    );
  }

  const admin = createAdminClient();
  const { data: participant, error: insertError } = await admin
    .from('participants')
    .insert({ session_id: session.id, display_name: parsed.data.displayName ?? null })
    .select('id')
    .single();

  if (insertError || !participant) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Could not join the session.' },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ sessionId: session.id });
  response.cookies.set(participantCookieName(session.id), participant.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PARTICIPANT_COOKIE_MAX_AGE,
  });
  return response;
}
