import { NextResponse } from 'next/server';
import { z } from 'zod';

import { PARTICIPANT_COOKIE_MAX_AGE, participantCookieName } from '@/lib/participant';
import { createAdminClient } from '@/lib/supabase/admin';

const joinSchema = z.object({
  code: z.string().trim().min(1),
  displayName: z.string().trim().min(1).max(60).optional(),
});

// POST /api/join — resolve an active session by code, create an anonymous
// participant, and drop an httpOnly join cookie. Returns the session id so the
// client can route to /session/[id].
//
// Runs entirely with the service-role client, so it doesn't depend on an anon
// EXECUTE grant for check_session_code (that grant is easy to miss when applying
// migrations, and was causing "permission denied for function").
export async function POST(request: Request) {
  const parsed = joinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid join request.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Session codes are stored uppercase; normalize the typed/scanned code.
  const { data: session, error } = await admin
    .from('sessions')
    .select('id, status')
    .eq('session_code', parsed.data.code.toUpperCase())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!session || session.status !== 'active') {
    return NextResponse.json(
      { error: "That session isn't active. Check the code with your facilitator." },
      { status: 404 },
    );
  }

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
