import { makePollActionRoute } from '@/lib/session-question-actions';

// PATCH /api/session-questions/[id]/reveal
export const PATCH = makePollActionRoute('reveal');
