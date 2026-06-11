'use client';

export function WordCloudInput({
  maxEntries,
  value,
  onChange,
}: {
  maxEntries: number;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const setWord = (index: number, word: string) => {
    const next = Array.from({ length: maxEntries }, (_, i) => value[i] ?? '');
    next[index] = word;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: maxEntries }).map((_, index) => (
        <input
          key={index}
          value={value[index] ?? ''}
          onChange={(e) => setWord(index, e.target.value)}
          maxLength={40}
          placeholder={index === 0 ? 'Type a word…' : 'Another word (optional)'}
          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-base"
        />
      ))}
    </div>
  );
}
