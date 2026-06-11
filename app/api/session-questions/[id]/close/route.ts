import { makePollActionRoute } from '@/lib/session-question-actions';

// PATCH /api/session-questions/[id]/close
export const PATCH = makePollActionRoute('close');
