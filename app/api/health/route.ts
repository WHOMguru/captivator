import { NextResponse } from 'next/server';

// Lightweight liveness probe. Useful for verifying the deployment and for the
// participant bundle (which must not import any Office.js code).
export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'captivator',
    timestamp: new Date().toISOString(),
  });
}
