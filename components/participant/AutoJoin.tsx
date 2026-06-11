'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Joins the session for the scanned code, then routes to the active-session
// view. Anonymous by default — no name required.
export function AutoJoin({ code }: { code: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const res = await fetch('/api/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? 'Could not join the session.');
          return;
        }
        const { sessionId } = (await res.json()) as { sessionId: string };
        router.replace(`/session/${sessionId}`);
      } catch {
        setError('Could not reach the server. Check your connection and try again.');
      }
    })();
  }, [code, router]);

  if (error) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-base text-slate-700">{error}</p>
        <p className="font-mono text-sm uppercase tracking-widest text-slate-400">{code}</p>
      </div>
    );
  }

  return <p className="animate-pulse text-center text-base text-slate-500">Joining…</p>;
}
