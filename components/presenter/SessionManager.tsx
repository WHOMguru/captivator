'use client';

import { useCallback, useEffect, useState } from 'react';

import { authedFetch } from '@/lib/api';
import { ensureSession } from '@/lib/supabase/ensure-session';
import { cn } from '@/lib/utils';
import type { SessionStatus } from '@/types/database';

import { SessionResults } from '@/components/results/SessionResults';

import { SessionQrCode } from './SessionQrCode';
import type { QuestionOption, SessionListItem } from './types';

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
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resultsId, setResultsId] = useState<string | null>(null);

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

  const openLauncher = async () => {
    setLauncherOpen(true);
    setSelected([]);
    const res = await authedFetch('/api/questions');
    if (res.ok) {
      const body = (await res.json()) as { questions: QuestionOption[] };
      setQuestions(body.questions);
    }
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const createSession = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await authedFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: selected }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Could not create the session.');
      }
      const created = (await res.json()) as { id: string };
      await refresh();
      setLauncherOpen(false);
      setExpandedId(created.id);
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
      if (action === 'start') setExpandedId(id);
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

      {!launcherOpen && (
        <button
          type="button"
          onClick={openLauncher}
          className="w-full rounded-md bg-captivator-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          + Start a session
        </button>
      )}

      {launcherOpen && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Select questions
          </p>
          {questions.length === 0 ? (
            <p className="text-sm text-slate-500">No questions yet — add polls first.</p>
          ) : (
            <ul className="space-y-1">
              {questions.map((q) => (
                <li key={q.id}>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selected.includes(q.id)}
                      onChange={() => toggle(q.id)}
                    />
                    <span className="truncate">{q.prompt}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={busy || selected.length === 0}
              onClick={createSession}
              className={cn(
                'rounded-md bg-captivator-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90',
                (busy || selected.length === 0) && 'opacity-50',
              )}
            >
              Create session
            </button>
            <button
              type="button"
              onClick={() => setLauncherOpen(false)}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          No sessions yet.
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
                    {session.question_count} question
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
                  <button
                    type="button"
                    onClick={() => setExpandedId((id) => (id === session.id ? null : session.id))}
                    className="font-medium text-slate-500 hover:underline"
                  >
                    {expandedId === session.id ? 'Hide code' : 'Show code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultsId((id) => (id === session.id ? null : session.id))}
                    className="font-medium text-slate-500 hover:underline"
                  >
                    {resultsId === session.id ? 'Hide results' : 'Results'}
                  </button>
                </div>
              </div>
              {expandedId === session.id && (
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
