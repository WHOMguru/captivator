import { z } from 'zod';

import type { QuestionType } from '@/lib/schemas/question';

// Participant answer payloads, one schema per question type. Shared by the
// response components (client) and POST /api/responses (server). The route
// additionally cross-checks each payload against the question's config (options,
// limits) since config isn't known here.

export const multipleChoiceResponseSchema = z.object({
  selected: z.array(z.string()).min(1, 'Pick at least one option.'),
});

export const wordCloudResponseSchema = z.object({
  words: z.array(z.string().trim().min(1)).min(1, 'Add at least one word.').max(20),
});

export const openTextResponseSchema = z.object({
  text: z.string().trim().min(1, 'Enter a response.').max(2000),
});

export const rankingResponseSchema = z.object({
  order: z.array(z.string()).min(2, 'Rank the items.'),
});

export type MultipleChoiceResponse = z.infer<typeof multipleChoiceResponseSchema>;
export type WordCloudResponse = z.infer<typeof wordCloudResponseSchema>;
export type OpenTextResponse = z.infer<typeof openTextResponseSchema>;
export type RankingResponse = z.infer<typeof rankingResponseSchema>;

export function responseSchemaFor(type: QuestionType) {
  switch (type) {
    case 'multiple_choice':
      return multipleChoiceResponseSchema;
    case 'word_cloud':
      return wordCloudResponseSchema;
    case 'open_text':
      return openTextResponseSchema;
    case 'ranking':
      return rankingResponseSchema;
  }
}
