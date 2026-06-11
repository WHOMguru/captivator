import type { SessionStatus } from '@/types/database';

export type SessionListItem = {
  id: string;
  session_code: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  question_count: number;
};

// Minimal question shape needed by the session launcher's picker.
export type QuestionOption = {
  id: string;
  type: string;
  prompt: string;
};
