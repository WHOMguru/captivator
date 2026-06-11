import { z } from 'zod';

// Single source of truth for question validation. The client editor validates
// with `questionFormSchema` (flat, React-Hook-Form friendly); the API route
// validates the canonical `createQuestionSchema` payload. `toCreatePayload`
// bridges the two so both consumers share the same rules.

export const QUESTION_TYPES = ['multiple_choice', 'word_cloud', 'open_text', 'ranking'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  word_cloud: 'Word Cloud',
  open_text: 'Open Text',
  ranking: 'Ranking',
};

const promptSchema = z
  .string()
  .trim()
  .min(1, 'Add a question prompt.')
  .max(500, 'Keep the prompt under 500 characters.');

const optionList = z
  .array(z.string().trim().min(1))
  .min(2, 'Add at least two options.')
  .max(10, 'Up to ten options.');

// ---- Per-type config (stored verbatim in questions.config jsonb) ----------

export const multipleChoiceConfigSchema = z.object({
  options: optionList,
  allowMultiple: z.boolean().default(false),
});

export const wordCloudConfigSchema = z.object({
  maxEntries: z.coerce.number().int().min(1).max(10).default(3),
});

export const openTextConfigSchema = z.object({
  maxLength: z.coerce.number().int().min(10).max(2000).default(280),
});

export const rankingConfigSchema = z.object({
  items: optionList,
});

export type MultipleChoiceConfig = z.infer<typeof multipleChoiceConfigSchema>;
export type WordCloudConfig = z.infer<typeof wordCloudConfigSchema>;
export type OpenTextConfig = z.infer<typeof openTextConfigSchema>;
export type RankingConfig = z.infer<typeof rankingConfigSchema>;

// ---- Canonical create/update payload (server-validated) -------------------

const slideFields = {
  slideId: z.string().trim().min(1).optional(),
  deckId: z.string().trim().min(1).optional(),
};

export const createQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('multiple_choice'),
    prompt: promptSchema,
    config: multipleChoiceConfigSchema,
    ...slideFields,
  }),
  z.object({
    type: z.literal('word_cloud'),
    prompt: promptSchema,
    config: wordCloudConfigSchema,
    ...slideFields,
  }),
  z.object({
    type: z.literal('open_text'),
    prompt: promptSchema,
    config: openTextConfigSchema,
    ...slideFields,
  }),
  z.object({
    type: z.literal('ranking'),
    prompt: promptSchema,
    config: rankingConfigSchema,
    ...slideFields,
  }),
]);

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

// ---- Flat form schema (React Hook Form) -----------------------------------

// No defaults/coercion here so the form's input and output types match, which
// keeps the React-Hook-Form resolver types clean. Initial values come from
// DEFAULT_QUESTION_FORM instead.
export const questionFormSchema = z
  .object({
    type: z.enum(QUESTION_TYPES),
    prompt: promptSchema,
    // MC + ranking share an editable option list.
    options: z.array(z.string()),
    allowMultiple: z.boolean(),
    maxEntries: z.number().int().min(1).max(10),
    maxLength: z.number().int().min(10).max(2000),
    slideId: z.string().optional(),
    deckId: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'multiple_choice' || values.type === 'ranking') {
      const cleaned = values.options.map((o) => o.trim()).filter(Boolean);
      if (cleaned.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'Add at least two options.',
        });
      }
    }
  });

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

export const DEFAULT_QUESTION_FORM: QuestionFormValues = {
  type: 'multiple_choice',
  prompt: '',
  options: ['', ''],
  allowMultiple: false,
  maxEntries: 3,
  maxLength: 280,
};

/** Map flat form values to the canonical create payload validated server-side. */
export function toCreatePayload(values: QuestionFormValues): CreateQuestionInput {
  const slide = values.slideId
    ? { slideId: values.slideId, ...(values.deckId ? { deckId: values.deckId } : {}) }
    : {};

  const options = values.options.map((o) => o.trim()).filter(Boolean);

  switch (values.type) {
    case 'multiple_choice':
      return {
        type: 'multiple_choice',
        prompt: values.prompt,
        config: { options, allowMultiple: values.allowMultiple },
        ...slide,
      };
    case 'ranking':
      return {
        type: 'ranking',
        prompt: values.prompt,
        config: { items: options },
        ...slide,
      };
    case 'word_cloud':
      return {
        type: 'word_cloud',
        prompt: values.prompt,
        config: { maxEntries: values.maxEntries },
        ...slide,
      };
    case 'open_text':
      return {
        type: 'open_text',
        prompt: values.prompt,
        config: { maxLength: values.maxLength },
        ...slide,
      };
  }
}

/** Map a persisted question row back to flat form values for editing. */
export function toFormValues(
  type: QuestionType,
  prompt: string,
  config: unknown,
): QuestionFormValues {
  const base = { ...DEFAULT_QUESTION_FORM, type, prompt };
  const c = (config ?? {}) as Record<string, unknown>;

  switch (type) {
    case 'multiple_choice':
      return {
        ...base,
        options: Array.isArray(c.options) ? (c.options as string[]) : ['', ''],
        allowMultiple: Boolean(c.allowMultiple),
      };
    case 'ranking':
      return {
        ...base,
        options: Array.isArray(c.items) ? (c.items as string[]) : ['', ''],
      };
    case 'word_cloud':
      return { ...base, maxEntries: Number(c.maxEntries ?? 3) };
    case 'open_text':
      return { ...base, maxLength: Number(c.maxLength ?? 280) };
  }
}
