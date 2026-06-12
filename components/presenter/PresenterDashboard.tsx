'use client';

import { useCallback, useEffect, useState } from 'react';

import { ResultsPanel } from '@/components/results/ResultsPanel';
import { authedFetch } from '@/lib/api';
import type { QuestionType } from '@/lib/schemas/question';
import { cn } from '@/lib/utils';
import type { PollState } from '@/types/database';

type Item = {
  sessionQuestionId: string;
  prompt: string;
  type: QuestionType;
  config: unknown;
  pollState: PollState;
  revealed: boolean;
  slideIds: string[];
};

type ApiQuestion = {
  sessionQuestionId: string;
  prompt: string;
  type: QuestionType;
  config: unknown;
  pollState: PollState;
  resultsRevealed: boolean;
  slideIds: string[];
};

export function PresenterDashboard({
  getCurrentSlide,
  subscribeSlide,
  onInsertOnSlide,
}: {
  getCurrentSlide?: () => Promise<{ slideId: string } | null>;
  subscribeSlide?: (onChange: (slideId: string | null) => void) => Promise<() => void>;
  onInsertOnSlide?: (text: string) => Promise<void>;
}) {
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
  const [session, setSession] = useState<{ id: string; code: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inserted, setInserted] = useState(false);

  // Use the API routes (authedFetch) rather than direct browser queries — the
  // same reliable path the rest of the facilitator UI uses.
  const fetchItems = useCallback(async (sessionId: string) => {
    const res = await authedFetch(`/api/sessions/${sessionId}/questions`);
    if (!res.ok) return;
    const body = (await res.json()) as { questions: ApiQuestion[] };
    setItems(
      body.questions.map((q) => ({
        sessionQuestionId: q.sessionQuestionId,
        prompt: q.prompt,
        type: q.type,
        config: q.config,
        pollState: q.pollState,
        revealed: q.resultsRevealed,
        slideIds: q.slideIds,
      })),
    );
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await authedFetch('/api/sessions');
      if (!active) return;
      if (res.ok) {
        const body = (await res.json()) as {
          sessions: Array<{ id: string; session_code: string; status: string }>;
        };
        const live = body.sessions.find((s) => s.status === 'active');
        if (live) {
          setSession({ id: live.id, code: live.session_code });
          await fetchItems(live.id);
        }
      }
      setPhase('ready');
    })();
    return () => {
      active = false;
    };
  }, [fetchItems]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void getCurrentSlide?.().then((s) => setCurrentSlideId(s?.slideId ?? null));
    void subscribeSlide?.((slideId) => setCurrentSlideId(slideId)).then((fn) => {
      unsub = fn;
    });
    return () => unsub?.();
  }, [getCurrentSlide, subscribeSlide]);

  // Keep the poll list and states fresh so polls created while presenting (which
  // auto-attach to the active session) appear without a manual reload.
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => void fetchItems(session.id), 4000);
    return () => clearInterval(timer);
  }, [session, fetchItems]);

  const auto = items.find((it) => currentSlideId && it.slideIds.includes(currentSlideId));
  // Prefer a manual pick, then the slide-linked poll, then just the first one —
  // so controls are visible as soon as the session has any polls.
  const selected = manualId
    ? items.find((it) => it.sessionQuestionId === manualId)
    : (auto ?? items[0]);

  const runAction = async (action: 'launch' | 'close' | 'reveal' | 'hide') => {
    if (!selected || !session) return;
    setBusy(true);
    try {
      await authedFetch(`/api/session-questions/${selected.sessionQuestionId}/${action}`, {
        method: 'PATCH',
      });
      await fetchItems(session.id);
    } finally {
      setBusy(false);
    }
  };

  const insertOnSlide = async () => {
    if (!onInsertOnSlide || !selected || !session) return;
    setBusy(true);
    try {
      const origin = window.location.origin;
      const text = `${selected.prompt}\n\nJoin at ${origin}/join/${session.code}\nCode: ${session.code}`;
      await onInsertOnSlide(text);
      setInserted(true);
      setTimeout(() => setInserted(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'loading') {
    return <p className="text-sm text-slate-500">Loading presenter controls…</p>;
  }
  if (!session) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        No active session. Start one in Sessions to use presenter controls.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-md bg-captivator-accent-light px-3 py-2">
        <span className="text-sm font-medium text-captivator-accent">Presenting</span>
        <span className="font-mono text-lg font-bold tracking-widest text-captivator-accent">
          {session.code}
        </span>
      </div>

      <p className="text-xs text-slate-400">
        {currentSlideId
          ? auto
            ? `Slide ${currentSlideId} → linked question`
            : `Slide ${currentSlideId} → no linked question`
          : 'No slide detected (open in PowerPoint, or pick a question below).'}
      </p>

      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Question
        <select
          value={selected?.sessionQuestionId ?? ''}
          onChange={(e) => setManualId(e.target.value || null)}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
        >
          <option value="">{auto ? `(slide) ${auto.prompt}` : 'Select a question…'}</option>
          {items.map((it) => (
            <option key={it.sessionQuestionId} value={it.sessionQuestionId}>
              {it.prompt}
            </option>
          ))}
        </select>
      </label>

      {selected && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
                selected.pollState === 'open'
                  ? 'bg-green-100 text-green-700'
                  : selected.pollState === 'closed'
                    ? 'bg-slate-200 text-slate-500'
                    : 'bg-slate-100 text-slate-500',
              )}
            >
              {selected.pollState}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
                selected.revealed
                  ? 'bg-captivator-accent-light text-captivator-accent'
                  : 'bg-slate-100 text-slate-400',
              )}
            >
              {selected.revealed ? 'results shown' : 'results hidden'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              type="button"
              disabled={busy || selected.pollState === 'open'}
              onClick={() => runAction('launch')}
              className="rounded-md bg-captivator-accent px-3 py-2 font-medium text-white disabled:opacity-40"
            >
              Launch
            </button>
            <button
              type="button"
              disabled={busy || selected.pollState !== 'open'}
              onClick={() => runAction('close')}
              className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 disabled:opacity-40"
            >
              Close
            </button>
            <button
              type="button"
              disabled={busy || selected.revealed}
              onClick={() => runAction('reveal')}
              className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 disabled:opacity-40"
            >
              Reveal results
            </button>
            <button
              type="button"
              disabled={busy || !selected.revealed}
              onClick={() => runAction('hide')}
              className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 disabled:opacity-40"
            >
              Hide results
            </button>
          </div>

          {onInsertOnSlide && (
            <button
              type="button"
              disabled={busy}
              onClick={insertOnSlide}
              className="w-full rounded-md border border-captivator-accent px-3 py-2 text-sm font-medium text-captivator-accent disabled:opacity-40"
            >
              {inserted ? 'Inserted on slide ✓' : 'Insert poll on current slide'}
            </button>
          )}

          <ResultsPanel
            sessionQuestionId={selected.sessionQuestionId}
            type={selected.type}
            config={selected.config}
          />
        </div>
      )}
    </div>
  );
}
