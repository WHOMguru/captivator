'use client';

import { useCallback, useEffect, useState } from 'react';

import { SessionResults } from '@/components/results/SessionResults';
import { authedFetch } from '@/lib/api';
import { ensureSession } from '@/lib/supabase/ensure-session';
import { cn } from '@/lib/utils';
import type { SessionStatus } from '@/types/database';

import { SessionPolls } from './SessionPolls';
import { SessionQrCode } from './SessionQrCode';
import type { SessionListItem } from './types';

const BADGE: Record<SessionStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-green-100 text-green-700',
  ended: 'bg-slate-200 text-slate-500',
};

function StatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        BADGE[status],
      )}
    >
      {status}
    </span>
  );
}

export function SessionManager() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [codeId, setCodeId] = useState<string | null>(null);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [pollsId, setPollsId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await authedFetch('/api/sessions');
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? 'Could not load sessions.');
    }
    const body = (await res.json()) as { sessions: SessionListItem[] };
    setSessions(body.sessions);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const userId = await ensureSession();
      if (!active) return;
      if (!userId) {
        setStatus('error');
        setError(
          'Could not start a facilitator session. Enable Anonymous sign-ins in Supabase Auth.',
        );
        return;
      }
      try {
        await refresh();
        if (active) setStatus('ready');
      } catch (e) {
        if (active) {
          setStatus('error');
          setError(e instanceof Error ? e.message : 'Could not load sessions.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const startSession = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Could not create the session.');
      }
      const created = (await res.json()) as { id: string };
      await refresh();
      // Open the new session's poll picker so the facilitator can fill it.
      setPollsId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the session.');
    } finally {
      setBusy(false);
    }
  };

  const transition = async (id: string, action: 'start' | 'end') => {
    setBusy(true);
    try {
      await authedFetch(`/api/sessions/${id}/${action}`, { method: 'PATCH' });
      await refresh();
      if (action === 'start') setCodeId(id);
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return <p className="text-sm text-slate-500">Loading sessions…</p>;
  }
  if (status === 'error') {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const active = sessions.find((s) => s.status === 'active');

  return (
    <div className="space-y-3">
      {active && (
        <div className="flex items-center justify-between rounded-md bg-captivator-accent-light px-3 py-2">
          <span className="text-sm font-medium text-captivator-accent">Live session</span>
          <span className="font-mono text-lg font-bold tracking-widest text-captivator-accent">
            {active.session_code}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={startSession}
        disabled={busy}
        className={cn(
          'w-full rounded-md bg-captivator-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90',
          busy && 'opacity-60',
        )}
      >
        + New session
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No sessions yet. Create one, then add polls to it.
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={session.status} />
                  <span className="font-mono text-sm font-semibold tracking-widest text-slate-900">
                    {session.session_code}
                  </span>
                  <span className="text-xs text-slate-400">
                    {session.question_count} poll
                    {session.question_count === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2 text-sm">
                  {session.status === 'draft' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => transition(session.id, 'start')}
                      className="font-medium text-captivator-accent hover:underline"
                    >
                      Start
                    </button>
                  )}
                  {session.status === 'active' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => transition(session.id, 'end')}
                      className="font-medium text-slate-400 hover:text-red-600"
                    >
                      End
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setPollsId((id) => (id === session.id ? null : session.id))}
                  className="font-medium text-slate-500 hover:underline"
                >
                  {pollsId === session.id ? 'Hide polls' : 'Polls'}
                </button>
                <button
                  type="button"
                  onClick={() => setCodeId((id) => (id === session.id ? null : session.id))}
                  className="font-medium text-slate-500 hover:underline"
                >
                  {codeId === session.id ? 'Hide code' : 'Show code'}
                </button>
                <button
                  type="button"
                  onClick={() => setResultsId((id) => (id === session.id ? null : session.id))}
                  className="font-medium text-slate-500 hover:underline"
                >
                  {resultsId === session.id ? 'Hide results' : 'Results'}
                </button>
              </div>

              {pollsId === session.id && (
                <div className="mt-3">
                  <SessionPolls sessionId={session.id} onChanged={() => void refresh()} />
                </div>
              )}
              {codeId === session.id && (
                <div className="mt-3">
                  <SessionQrCode code={session.session_code} />
                </div>
              )}
              {resultsId === session.id && (
                <div className="mt-3">
                  <SessionResults sessionId={session.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
