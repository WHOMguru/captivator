import { makePollActionRoute } from '@/lib/session-question-actions';

// PATCH /api/session-questions/[id]/launch
export const PATCH = makePollActionRoute('launch');
