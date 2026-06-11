import { NextResponse } from 'next/server';

import { authenticateRequest } from '@/lib/supabase/request-auth';

// GET /api/whoami — auth diagnostic. Reports whether the request authenticated
// (via Bearer token or cookie) so the add-in can show where auth breaks. Always
// 200 so the client can read the body either way.
export async function GET(request: Request) {
  const { userId } = await authenticateRequest(request);
  return NextResponse.json({
    userId,
    authenticated: Boolean(userId),
    hadAuthHeader: Boolean(request.headers.get('Authorization')),
  });
}
