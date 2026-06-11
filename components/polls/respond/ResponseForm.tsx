'use client';

import { useMemo, useState } from 'react';

import {
  multipleChoiceConfigSchema,
  openTextConfigSchema,
  rankingConfigSchema,
  wordCloudConfigSchema,
  type QuestionType,
} from '@/lib/schemas/question';
import { cn } from '@/lib/utils';

import { MultipleChoiceInput } from './MultipleChoiceInput';
import { OpenTextInput } from './OpenTextInput';
import { RankingInput } from './RankingInput';
import { WordCloudInput } from './WordCloudInput';

type Value = { selected: string[]; words: string[]; text: string; order: string[] };

export function ResponseForm({
  sessionQuestionId,
  type,
  prompt,
  config,
  answered,
  onAnswered,
}: {
  sessionQuestionId: string;
  type: QuestionType;
  prompt: string;
  config: unknown;
  answered: boolean;
  onAnswered: () => void;
}) {
  const ranking = useMemo(
    () => (type === 'ranking' ? rankingConfigSchema.parse(config) : null),
    [type, config],
  );

  const [value, setValue] = useState<Value>({
    selected: [],
    words: [],
    text: '',
    order: ranking ? ranking.items : [],
  });
  const [submitted, setSubmitted] = useState(answered);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildPayload = (): Record<string, unknown> => {
    switch (type) {
      case 'multiple_choice':
        return { selected: value.selected };
      case 'word_cloud':
        return { words: value.words.map((w) => w.trim()).filter(Boolean) };
      case 'open_text':
        return { text: value.text.trim() };
      case 'ranking':
        return { order: value.order };
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionQuestionId, payload: buildPayload() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Could not submit your answer.');
      }
      setSubmitted(true);
      onAnswered();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your answer.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{prompt}</h2>
        {submitted && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Submitted
          </span>
        )}
      </div>

      {type === 'multiple_choice' && (
        <MultipleChoiceInput
          options={multipleChoiceConfigSchema.parse(config).options}
          allowMultiple={multipleChoiceConfigSchema.parse(config).allowMultiple}
          value={value.selected}
          onChange={(selected) => setValue((v) => ({ ...v, selected }))}
        />
      )}
      {type === 'word_cloud' && (
        <WordCloudInput
          maxEntries={wordCloudConfigSchema.parse(config).maxEntries}
          value={value.words}
          onChange={(words) => setValue((v) => ({ ...v, words }))}
        />
      )}
      {type === 'open_text' && (
        <OpenTextInput
          maxLength={openTextConfigSchema.parse(config).maxLength}
          value={value.text}
          onChange={(text) => setValue((v) => ({ ...v, text }))}
        />
      )}
      {type === 'ranking' && (
        <RankingInput
          value={value.order}
          onChange={(order) => setValue((v) => ({ ...v, order }))}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className={cn(
          'w-full rounded-lg bg-captivator-accent px-4 py-3 text-base font-medium text-white transition active:opacity-90',
          busy && 'opacity-60',
        )}
      >
        {submitted ? 'Update answer' : 'Submit'}
      </button>
    </section>
  );
}
