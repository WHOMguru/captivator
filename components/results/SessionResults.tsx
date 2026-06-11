'use client';

import { useEffect, useState } from 'react';

import type { QuestionType } from '@/lib/schemas/question';
import { ensureSession } from '@/lib/supabase/ensure-session';
import { createClient } from '@/lib/supabase/client';

import { ResultsPanel } from './ResultsPanel';

type ResultQuestion = {
  sessionQuestionId: string;
  type: QuestionType;
  prompt: string;
  config: unknown;
};

// Lists a session's questions (via RLS-scoped browser query) and renders a live
// ResultsPanel for each. Used by the facilitator in /addin and /dashboard.
export function SessionResults({ sessionId }: { sessionId: string }) {
  const [supabase] = useState(() => createClient());
  const [questions, setQuestions] = useState<ResultQuestion[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      await ensureSession();
      const { data, error } = await supabase
        .from('session_questions')
        .select('id, launch_order, questions(type, prompt, config)')
        .eq('session_id', sessionId)
        .order('launch_order', { ascending: true });
      if (!active) return;
      if (error) {
        setPhase('error');
        return;
      }
      setQuestions(
        (data ?? [])
          .filter((row) => row.questions)
          .map((row) => ({
            sessionQuestionId: row.id,
            type: row.questions!.type,
            prompt: row.questions!.prompt,
            config: row.questions!.config,
          })),
      );
      setPhase('ready');
    })();
    return () => {
      active = false;
    };
  }, [supabase, sessionId]);

  if (phase === 'loading') {
    return <p className="text-sm text-slate-500">Loading results…</p>;
  }
  if (phase === 'error') {
    return <p className="text-sm text-red-600">Couldn’t load results.</p>;
  }
  if (questions.length === 0) {
    return <p className="text-sm text-slate-500">No questions in this session.</p>;
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <div key={q.sessionQuestionId} className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-2 text-sm font-medium text-slate-800">{q.prompt}</p>
          <ResultsPanel sessionQuestionId={q.sessionQuestionId} type={q.type} config={q.config} />
        </div>
      ))}
    </div>
  );
}
