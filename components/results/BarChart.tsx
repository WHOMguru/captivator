'use client';

import { Bar, BarChart as ReBarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import type { Tally } from '@/lib/results/aggregate';

const ACCENT = '#1F4E79';

// Multiple-choice tallies as a horizontal bar chart.
export function BarChart({ data }: { data: Tally[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No responses yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 44)}>
      <ReBarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 12, fill: '#334155' }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 12 }}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={ACCENT} />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}
