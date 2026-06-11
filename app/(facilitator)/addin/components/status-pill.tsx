import { cn } from '@/lib/utils';

export type ConnectionState = 'connecting' | 'connected' | 'error';

const DOT: Record<ConnectionState, string> = {
  connecting: 'bg-amber-400 animate-pulse',
  connected: 'bg-green-500',
  error: 'bg-red-500',
};

const TEXT: Record<ConnectionState, string> = {
  connecting: 'text-amber-700',
  connected: 'text-green-700',
  error: 'text-red-700',
};

export function StatusPill({ label, state }: { label: string; state: ConnectionState }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium shadow-sm">
      <span className={cn('h-2 w-2 rounded-full', DOT[state])} />
      <span className={TEXT[state]}>{label}</span>
    </span>
  );
}
