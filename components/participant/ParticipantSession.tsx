'use client';

import { useCallback, useEffect, useState } from 'react';

import { ResponseForm } from '@/components/polls/respond/ResponseForm';
import { LiveResultsLite } from '@/components/results/LiveResultsLite';
import type { QuestionType } from '@/lib/schemas/question';
import type { FeedEntry, Tally } from '@/lib/results/aggregate';
import type { SessionStatus } from '@/types/database';

type OpenQuestion = {
  sessionQuestionId: string;
  type: QuestionType;
  prompt: string;
  config: unknown;
  answered: boolean;
};

type RevealedResult = {
  sessionQuestionId: string;
  type: QuestionType;
  prompt: string;
  tally?: Tally[];
  feed?: FeedEntry[];
};

type CurrentData = {
  status: SessionStatus;
  open: OpenQuestion | null;
  revealed: RevealedResult[];
};

const POLL_MS = 4000;

export function ParticipantSession({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<CurrentData | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}/current`, { cache: 'no-store' });
    if (res.status === 401) {
      setPhase('error');
      setError('You need to join this session. Scan the QR code or open the join link again.');
      return;
    }
    if (!res.ok) {
      setPhase('error');
      setError('Could not load the session.');
      return;
    }
    setData((await res.json()) as CurrentData);
    setPhase('ready');
  }, [sessionId]);

  useEffect(() => {
    void load();
    // Sprint 4 added Realtime for the facilitator; the participant view stays on
    // a light poll, which also picks up poll-state/reveal changes from Sprint 5.
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (phase === 'loading') {
    return <p className="text-center text-slate-500">Loading…</p>;
  }
  if (phase === 'error') {
    return <p className="text-center text-slate-600">{error}</p>;
  }
  if (!data) return null;

  if (data.status === 'draft') {
    return (
      <p className="text-center text-slate-600">You’re in. Waiting for the facilitator to start…</p>
    );
  }
  if (data.status === 'ended') {
    return (
      <p className="text-center text-slate-600">This session has ended. Thanks for taking part!</p>
    );
  }

  const idle = !data.open && data.revealed.length === 0;

  return (
    <div className="space-y-4">
      {data.open && (
        <ResponseForm
          key={data.open.sessionQuestionId}
          sessionQuestionId={data.open.sessionQuestionId}
          type={data.open.type}
          prompt={data.open.prompt}
          config={data.open.config}
          answered={data.open.answered}
          onAnswered={() => void load()}
        />
      )}

      {data.revealed.map((r) => (
        <LiveResultsLite
          key={r.sessionQuestionId}
          prompt={r.prompt}
          tally={r.tally}
          feed={r.feed}
        />
      ))}

      {idle && (
        <p className="text-center text-slate-600">Waiting for the facilitator to open a poll…</p>
      )}
    </div>
  );
}
