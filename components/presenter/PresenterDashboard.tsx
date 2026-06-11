'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ResultsPanel } from '@/components/results/ResultsPanel';
import type { QuestionType } from '@/lib/schemas/question';
import { ensureSession } from '@/lib/supabase/ensure-session';
import { createClient } from '@/lib/supabase/client';
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

export function PresenterDashboard({
  getCurrentSlide,
  subscribeSlide,
}: {
  getCurrentSlide?: () => Promise<{ slideId: string } | null>;
  subscribeSlide?: (onChange: (slideId: string | null) => void) => Promise<() => void>;
}) {
  // Create the browser client lazily inside effects only — never during render,
  // so static prerender (no env vars) doesn't try to construct it.
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }, []);
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
  const [session, setSession] = useState<{ id: string; code: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchItems = useCallback(
    async (sessionId: string) => {
      const { data } = await getSupabase()
        .from('session_questions')
        .select(
          'id, poll_state, results_revealed, launch_order, questions(prompt, type, config, slide_links(slide_id))',
        )
        .eq('session_id', sessionId)
        .order('launch_order', { ascending: true });
      setItems(
        (data ?? [])
          .filter((row) => row.questions)
          .map((row) => ({
            sessionQuestionId: row.id,
            prompt: row.questions!.prompt,
            type: row.questions!.type,
            config: row.questions!.config,
            pollState: row.poll_state,
            revealed: row.results_revealed,
            slideIds: (row.questions!.slide_links ?? []).map((s) => s.slide_id),
          })),
      );
    },
    [getSupabase],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      await ensureSession();
      const { data } = await getSupabase()
        .from('sessions')
        .select('id, session_code')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setSession({ id: data.id, code: data.session_code });
        await fetchItems(data.id);
      }
      setPhase('ready');
    })();
    return () => {
      active = false;
    };
  }, [getSupabase, fetchItems]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void getCurrentSlide?.().then((s) => setCurrentSlideId(s?.slideId ?? null));
    void subscribeSlide?.((slideId) => setCurrentSlideId(slideId)).then((fn) => {
      unsub = fn;
    });
    return () => unsub?.();
  }, [getCurrentSlide, subscribeSlide]);

  const auto = items.find((it) => currentSlideId && it.slideIds.includes(currentSlideId));
  const selected = manualId ? items.find((it) => it.sessionQuestionId === manualId) : auto;

  const runAction = async (action: 'launch' | 'close' | 'reveal' | 'hide') => {
    if (!selected || !session) return;
    setBusy(true);
    try {
      await fetch(`/api/session-questions/${selected.sessionQuestionId}/${action}`, {
        method: 'PATCH',
      });
      await fetchItems(session.id);
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
