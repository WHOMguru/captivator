'use client';

import { useCallback, useEffect, useState } from 'react';

import { authedFetch } from '@/lib/api';
import { ensureSession } from '@/lib/supabase/ensure-session';
import { toFormValues, type QuestionFormValues } from '@/lib/schemas/question';

import { QuestionEditor } from './QuestionEditor';
import { QuestionLibrary } from './QuestionLibrary';
import type { PickSlide, QuestionListItem } from './types';

type View =
  | { mode: 'library' }
  | { mode: 'new' }
  | { mode: 'edit'; id: string; values: QuestionFormValues };

export function PollAuthoring({ onPickSlide }: { onPickSlide?: PickSlide }) {
  const [view, setView] = useState<View>({ mode: 'library' });
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await authedFetch('/api/questions');
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? 'Could not load questions.');
    }
    const body = (await res.json()) as { questions: QuestionListItem[] };
    setQuestions(body.questions);
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
          setError(e instanceof Error ? e.message : 'Could not load questions.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  const handleSaved = async () => {
    await refresh().catch(() => undefined);
    setView({ mode: 'library' });
  };

  const handleDelete = async (id: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    await authedFetch(`/api/questions/${id}`, { method: 'DELETE' }).catch(() => undefined);
    await refresh().catch(() => undefined);
  };

  if (status === 'loading') {
    return <p className="text-sm text-slate-500">Loading your polls…</p>;
  }

  if (status === 'error') {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (view.mode === 'new' || view.mode === 'edit') {
    return (
      <QuestionEditor
        questionId={view.mode === 'edit' ? view.id : undefined}
        initialValues={view.mode === 'edit' ? view.values : undefined}
        onPickSlide={onPickSlide}
        onSaved={handleSaved}
        onCancel={() => setView({ mode: 'library' })}
      />
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setView({ mode: 'new' })}
        className="w-full rounded-md bg-captivator-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        + New poll
      </button>
      <QuestionLibrary
        questions={questions}
        onEdit={(question) =>
          setView({
            mode: 'edit',
            id: question.id,
            values: toFormValues(question.type, question.prompt, question.config),
          })
        }
        onDelete={handleDelete}
      />
    </div>
  );
}
