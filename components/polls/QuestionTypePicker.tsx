'use client';

import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionType } from '@/lib/schemas/question';
import { cn } from '@/lib/utils';

export function QuestionTypePicker({
  value,
  onChange,
}: {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {QUESTION_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'rounded-md border px-3 py-2 text-sm font-medium transition',
            value === type
              ? 'border-captivator-accent bg-captivator-accent-light text-captivator-accent'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
          )}
        >
          {QUESTION_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}
