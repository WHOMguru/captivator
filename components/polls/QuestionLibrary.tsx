'use client';

import { QUESTION_TYPE_LABELS } from '@/lib/schemas/question';

import type { QuestionListItem } from './types';

export function QuestionLibrary({
  questions,
  onEdit,
  onDelete,
}: {
  questions: QuestionListItem[];
  onEdit: (question: QuestionListItem) => void;
  onDelete: (id: string) => void;
}) {
  if (questions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        No questions yet. Add your first poll to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {questions.map((question) => {
        const slide = question.slide_links[0];
        return (
          <li key={question.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-captivator-accent">
                  {QUESTION_TYPE_LABELS[question.type]}
                </p>
                <p className="truncate text-sm font-medium text-slate-900">{question.prompt}</p>
                {slide && (
                  <p className="mt-1 truncate text-xs text-slate-400">
                    Linked to slide {slide.slide_id}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => onEdit(question)}
                  className="font-medium text-captivator-accent hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(question.id)}
                  className="font-medium text-slate-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
