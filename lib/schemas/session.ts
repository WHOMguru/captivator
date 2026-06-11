import { z } from 'zod';

// Validates the "create session" payload shared by the launcher form and the
// POST /api/sessions route: which questions to include, in order.
export const createSessionSchema = z.object({
  questionIds: z
    .array(z.string().uuid())
    .min(1, 'Select at least one question.')
    .max(50, 'Up to fifty questions per session.'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// Join codes: 6 chars, uppercase, ambiguity-free alphabet (no O/0, I/1).
export const SESSION_CODE_LENGTH = 6;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateSessionCode(): string {
  let code = '';
  for (let i = 0; i < SESSION_CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}
