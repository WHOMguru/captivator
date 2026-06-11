'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { authedFetch } from '@/lib/api';
import {
  DEFAULT_QUESTION_FORM,
  questionFormSchema,
  toCreatePayload,
  type QuestionFormValues,
} from '@/lib/schemas/question';
import { cn } from '@/lib/utils';

import { QuestionTypePicker } from './QuestionTypePicker';
import type { PickSlide } from './types';

export function QuestionEditor({
  questionId,
  initialValues,
  onPickSlide,
  onSaved,
  onCancel,
}: {
  questionId?: string;
  initialValues?: QuestionFormValues;
  onPickSlide?: PickSlide;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema) as Resolver<QuestionFormValues>,
    defaultValues: initialValues ?? DEFAULT_QUESTION_FORM,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, formState } = form;
  const type = watch('type');
  const options = watch('options');
  const slideId = watch('slideId');
  const usesOptions = type === 'multiple_choice' || type === 'ranking';

  const setOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setValue('options', next, { shouldValidate: true });
  };
  const addOption = () => setValue('options', [...options, '']);
  const removeOption = (index: number) =>
    setValue(
      'options',
      options.filter((_, i) => i !== index),
      { shouldValidate: true },
    );

  const pickSlide = async () => {
    if (!onPickSlide) return;
    const picked = await onPickSlide();
    if (!picked) {
      setSubmitError('No slide selected in PowerPoint.');
      return;
    }
    setSubmitError(null);
    setValue('slideId', picked.slideId);
    setValue('deckId', picked.deckId ?? undefined);
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = toCreatePayload(values);
    const res = await authedFetch(questionId ? `/api/questions/${questionId}` : '/api/questions', {
      method: questionId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setSubmitError(body?.error ?? 'Could not save the question.');
      return;
    }
    onSaved();
  });

  const fieldError = (name: keyof QuestionFormValues) =>
    formState.errors[name]?.message as string | undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Question type
        </label>
        <QuestionTypePicker
          value={type}
          onChange={(t) => setValue('type', t, { shouldValidate: true })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Prompt
        </label>
        <textarea
          {...register('prompt')}
          rows={2}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          placeholder="What do you want to ask?"
        />
        {fieldError('prompt') && <p className="text-xs text-red-600">{fieldError('prompt')}</p>}
      </div>

      {usesOptions && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {type === 'ranking' ? 'Items to rank' : 'Answer options'}
          </label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={option}
                onChange={(e) => setOption(index, e.target.value)}
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder={`Option ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="rounded-md border border-slate-200 px-2 text-sm text-slate-500 hover:bg-slate-50"
                aria-label="Remove option"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-sm font-medium text-captivator-accent hover:underline"
          >
            + Add option
          </button>
          {fieldError('options') && <p className="text-xs text-red-600">{fieldError('options')}</p>}
        </div>
      )}

      {type === 'multiple_choice' && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register('allowMultiple')} />
          Allow multiple selections
        </label>
      )}

      {type === 'word_cloud' && (
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Max entries per participant
          </label>
          <input
            type="number"
            min={1}
            max={10}
            {...register('maxEntries', { valueAsNumber: true })}
            className="w-24 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      {type === 'open_text' && (
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Max characters
          </label>
          <input
            type="number"
            min={10}
            max={2000}
            {...register('maxLength', { valueAsNumber: true })}
            className="w-24 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      {onPickSlide && (
        <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm">
          <button
            type="button"
            onClick={pickSlide}
            className="font-medium text-captivator-accent hover:underline"
          >
            Link current slide
          </button>
          <span className="truncate text-slate-500">
            {slideId ? `Slide ${slideId}` : 'No slide linked'}
          </span>
          {slideId && (
            <button
              type="button"
              onClick={() => setValue('slideId', undefined)}
              className="ml-auto text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className={cn(
            'rounded-md bg-captivator-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90',
            formState.isSubmitting && 'opacity-60',
          )}
        >
          {questionId ? 'Save changes' : 'Add question'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
