import type { QuestionType } from '@/lib/schemas/question';

// Shape returned by GET /api/questions and consumed by the authoring UI.
export type QuestionListItem = {
  id: string;
  type: QuestionType;
  prompt: string;
  config: unknown;
  created_at: string;
  slide_links: { slide_id: string; deck_id: string | null }[];
};

// Slide picked from PowerPoint. Kept local to components/polls so these shared
// components never import lib/office/* (the participant bundle stays clean).
export type PickedSlide = { slideId: string; deckId: string | null };

export type PickSlide = () => Promise<PickedSlide | null>;
