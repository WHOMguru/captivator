'use client';

import type { Tally } from '@/lib/results/aggregate';

// Lightweight, dependency-free word cloud: font size scales with frequency.
// (A d3-cloud layout is overkill for the task-pane width and adds bundle weight.)
export function WordCloud({ data }: { data: Tally[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No responses yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {data.map((entry) => {
        // Map count → 0.85rem..2rem.
        const scale = max > 0 ? entry.count / max : 0;
        const size = 0.85 + scale * 1.15;
        return (
          <span
            key={entry.label}
            title={`${entry.label}: ${entry.count}`}
            className="font-semibold text-captivator-accent"
            style={{ fontSize: `${size}rem`, opacity: 0.55 + scale * 0.45 }}
          >
            {entry.label}
          </span>
        );
      })}
    </div>
  );
}
