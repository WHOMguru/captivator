'use client';

import type { Tally } from '@/lib/results/aggregate';

// Borda-count aggregate as an ordered list with proportional bars.
export function RankingResults({ data }: { data: Tally[] }) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return <p className="text-sm text-slate-400">No responses yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <ol className="space-y-2">
      {data.map((entry, index) => (
        <li key={entry.label} className="flex items-center gap-3">
          <span className="w-5 shrink-0 font-mono text-sm font-semibold text-slate-400">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-sm">
              <span className="truncate text-slate-800">{entry.label}</span>
              <span className="ml-2 shrink-0 text-slate-400">{entry.count}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-captivator-accent"
                style={{ width: `${(entry.count / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
