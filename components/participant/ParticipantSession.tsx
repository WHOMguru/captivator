'use client';

import { useCallback, useEffect, useState } from 'react';

import { ResponseForm } from '@/components/polls/respond/ResponseForm';
import type { QuestionType } from '@/lib/schemas/question';
import type { SessionStatus } from '@/types/database';

type CurrentQuestion = {
  sessionQuestionId: string;
  pollState: string;
  type: QuestionType;
  prompt: string;
  config: unknown;
  answered: boolean;
};

type CurrentData = { status: SessionStatus; questions: CurrentQuestion[] };

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
    // Sprint 4 replaces this poll with a realtime subscription.
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

  if (data.questions.length === 0) {
    return <p className="text-center text-slate-600">No questions yet — hang tight.</p>;
  }

  return (
    <div className="space-y-4">
      {data.questions.map((q) => (
        <ResponseForm
          key={q.sessionQuestionId}
          sessionQuestionId={q.sessionQuestionId}
          type={q.type}
          prompt={q.prompt}
          config={q.config}
          answered={q.answered}
          onAnswered={() => void load()}
        />
      ))}
    </div>
  );
}
