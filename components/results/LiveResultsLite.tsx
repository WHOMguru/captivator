'use client';

import type { FeedEntry, Tally } from '@/lib/results/aggregate';

// Recharts-free results renderer for the participant view (keeps the mobile
// bundle lean). Handles tally bars and the open-text feed.
export function LiveResultsLite({
  prompt,
  tally,
  feed,
}: {
  prompt: string;
  tally?: Tally[];
  feed?: FeedEntry[];
}) {
  const max = tally ? Math.max(...tally.map((t) => t.count), 1) : 1;

  return (
    <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">{prompt}</h2>

      {tally && (
        <ul className="space-y-2">
          {tally.map((entry) => (
            <li key={entry.label}>
              <div className="flex justify-between text-sm">
                <span className="truncate text-slate-700">{entry.label}</span>
                <span className="ml-2 shrink-0 text-slate-400">{entry.count}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-captivator-accent"
                  style={{ width: `${(entry.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {feed && (
        <ul className="space-y-2">
          {feed.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              {entry.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
