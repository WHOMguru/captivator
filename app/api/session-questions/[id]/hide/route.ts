import { makePollActionRoute } from '@/lib/session-question-actions';

// PATCH /api/session-questions/[id]/hide
export const PATCH = makePollActionRoute('hide');
