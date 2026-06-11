'use client';

import { useCallback, useEffect, useState } from 'react';

import { authedFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

import type { QuestionOption } from './types';

type Attached = { sessionQuestionId: string; questionId: string };

// Attach/detach polls for a session. Lists the facilitator's polls with an
// Add/Remove toggle; works on draft or active sessions so polls can be added
// live. Calls onChanged so the parent can refresh its question counts.
export function SessionPolls({
  sessionId,
  onChanged,
}: {
  sessionId: string;
  onChanged: () => void;
}) {
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [attached, setAttached] = useState<Attached[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);

  const loadAttached = useCallback(async () => {
    const res = await authedFetch(`/api/sessions/${sessionId}/questions`);
    if (!res.ok) throw new Error('Could not load session polls.');
    const body = (await res.json()) as { questions: Attached[] };
    setAttached(body.questions);
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await authedFetch('/api/questions');
        const body = (await res.json()) as { questions: QuestionOption[] };
        await loadAttached();
        if (!active) return;
        setQuestions(body.questions);
        setPhase('ready');
      } catch {
        if (active) setPhase('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [loadAttached]);

  const attachedFor = (questionId: string) => attached.find((a) => a.questionId === questionId);

  const add = async (questionId: string) => {
    setBusy(true);
    try {
      await authedFetch(`/api/sessions/${sessionId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: [questionId] }),
      });
      await loadAttached();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (sessionQuestionId: string) => {
    setBusy(true);
    try {
      await authedFetch(`/api/session-questions/${sessionQuestionId}`, { method: 'DELETE' });
      await loadAttached();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'loading') {
    return <p className="text-sm text-slate-500">Loading polls…</p>;
  }
  if (phase === 'error') {
    return <p className="text-sm text-red-600">Could not load polls.</p>;
  }
  if (questions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No polls yet. Create one in the Polls section, then add it here.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {questions.map((q) => {
        const link = attachedFor(q.id);
        return (
          <li
            key={q.id}
            className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm text-slate-700">{q.prompt}</span>
            {link ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(link.sessionQuestionId)}
                className="shrink-0 text-sm font-medium text-slate-400 hover:text-red-600"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => add(q.id)}
                className={cn(
                  'shrink-0 text-sm font-medium text-captivator-accent hover:underline',
                  busy && 'opacity-50',
                )}
              >
                Add
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
