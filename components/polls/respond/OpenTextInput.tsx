'use client';

export function OpenTextInput({
  maxLength,
  value,
  onChange,
}: {
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={4}
        placeholder="Type your response…"
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-base"
      />
      <p className="text-right text-xs text-slate-400">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
