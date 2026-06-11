'use client';

import { useEffect, useState } from 'react';

import {
  multipleChoiceConfigSchema,
  rankingConfigSchema,
  type QuestionType,
} from '@/lib/schemas/question';
import { questionChannel } from '@/lib/realtime/channels';
import {
  bordaRanking,
  openTextFeed,
  tallyMultipleChoice,
  tallyWords,
  type ResponseRow,
} from '@/lib/results/aggregate';
import { ensureSession } from '@/lib/supabase/ensure-session';
import { createClient } from '@/lib/supabase/client';

import { BarChart } from './BarChart';
import { OpenTextFeed } from './OpenTextFeed';
import { RankingResults } from './RankingResults';
import { WordCloud } from './WordCloud';

function optionsOf(type: QuestionType, config: unknown): string[] {
  if (type === 'multiple_choice') {
    const parsed = multipleChoiceConfigSchema.safeParse(config);
    return parsed.success ? parsed.data.options : [];
  }
  if (type === 'ranking') {
    const parsed = rankingConfigSchema.safeParse(config);
    return parsed.success ? parsed.data.items : [];
  }
  return [];
}

// Live results for one session question. Loads existing responses, then
// subscribes to the question's Realtime channel and re-aggregates on each
// change (RLS limits delivery to the owning facilitator).
export function ResultsPanel({
  sessionQuestionId,
  type,
  config,
}: {
  sessionQuestionId: string;
  type: QuestionType;
  config: unknown;
}) {
  const [supabase] = useState(() => createClient());
  const [rows, setRows] = useState<ResponseRow[]>([]);

  useEffect(() => {
    let activeSub = true;

    const fetchRows = async () => {
      const { data } = await supabase
        .from('responses')
        .select('id, payload, submitted_at')
        .eq('session_question_id', sessionQuestionId)
        .order('submitted_at', { ascending: false });
      if (activeSub && data) setRows(data as ResponseRow[]);
    };

    const channel = supabase.channel(questionChannel(sessionQuestionId));

    (async () => {
      // Authorize the Realtime socket so RLS lets the facilitator read.
      await ensureSession();
      const { data } = await supabase.auth.getSession();
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      await fetchRows();

      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'responses',
            filter: `session_question_id=eq.${sessionQuestionId}`,
          },
          () => void fetchRows(),
        )
        .subscribe();
    })();

    return () => {
      activeSub = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, sessionQuestionId]);

  const options = optionsOf(type, config);

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">
        {rows.length} response{rows.length === 1 ? '' : 's'}
      </p>
      {type === 'multiple_choice' && <BarChart data={tallyMultipleChoice(options, rows)} />}
      {type === 'word_cloud' && <WordCloud data={tallyWords(rows)} />}
      {type === 'open_text' && <OpenTextFeed data={openTextFeed(rows)} />}
      {type === 'ranking' && <RankingResults data={bordaRanking(options, rows)} />}
    </div>
  );
}
