import { z } from 'zod';

// Validates the "create session" payload. Questions are optional now — a session
// is created as an empty room and polls are attached afterward.
export const createSessionSchema = z.object({
  questionIds: z.array(z.string().uuid()).max(50).optional().default([]),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// Payload for attaching polls to an existing session.
export const attachQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1).max(50),
});

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
