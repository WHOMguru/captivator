'use client';

export function RankingInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const a = next[index];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  };

  return (
    <ol className="space-y-2">
      {value.map((item, index) => (
        <li
          key={item}
          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
          <span className="font-mono text-sm font-semibold text-slate-400">{index + 1}</span>
          <span className="flex-1 text-base text-slate-800">{item}</span>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              aria-label={`Move ${item} up`}
              className="px-1 text-slate-400 disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === value.length - 1}
              aria-label={`Move ${item} down`}
              className="px-1 text-slate-400 disabled:opacity-30"
            >
              ▼
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
