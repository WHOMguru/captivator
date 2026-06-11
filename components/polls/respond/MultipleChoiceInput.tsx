'use client';

import { cn } from '@/lib/utils';

export function MultipleChoiceInput({
  options,
  allowMultiple,
  value,
  onChange,
}: {
  options: string[];
  allowMultiple: boolean;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (option: string) => {
    if (allowMultiple) {
      onChange(value.includes(option) ? value.filter((o) => o !== option) : [...value, option]);
    } else {
      onChange([option]);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              'w-full rounded-lg border px-4 py-3 text-left text-base transition',
              selected
                ? 'border-captivator-accent bg-captivator-accent-light font-medium text-captivator-accent'
                : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50',
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
