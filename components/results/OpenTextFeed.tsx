'use client';

import type { FeedEntry } from '@/lib/results/aggregate';

// Reverse-chronological feed of open-text responses, newest on top.
export function OpenTextFeed({ data }: { data: FeedEntry[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No responses yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map((entry) => (
        <li
          key={entry.id}
          className="animate-[fadeIn_0.3s_ease] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          {entry.text}
        </li>
      ))}
    </ul>
  );
}
