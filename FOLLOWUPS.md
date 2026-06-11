# Follow-ups

Deferred items surfaced during sprint work. Keep this list short; promote items
into a sprint when they're scheduled.

## Scheduled sprint insertions

### Sprint 6.5 — Facilitator Authentication (before Sprint 7)

Replace the temporary anonymous-session bootstrap with a real facilitator
sign-in. Runs after Sprint 6 (AI Insights) and before Sprint 7 (Reporting), so
exports and the session archive are tied to authenticated facilitator accounts.

Scope:

- Email (magic-link) and/or OAuth sign-in via Supabase Auth + `@supabase/ssr`.
- Sign-in / sign-out UI on `/addin` and `/dashboard`; gate authoring and
  sessions behind an authenticated user.
- Migrate any data created under anonymous sessions, or require sign-in before
  first authoring.
- Remove `lib/supabase/ensure-session.ts` (the anonymous bootstrap) once real
  auth lands; keep RLS unchanged (`owner_id = auth.uid()` still holds).

## From Sprint 1 (Poll Authoring)

- **Facilitator auth is a temporary anonymous bootstrap.** `lib/supabase/ensure-session.ts`
  signs the facilitator in anonymously so RLS (`owner_id = auth.uid()`) works,
  because the sprint sequence has no login surface yet. This requires **Anonymous
  sign-ins** to be enabled in Supabase (Authentication → Providers). Replaced by
  Sprint 6.5 (above) before V1 ship.
- **Single implicit workshop per facilitator.** `getOrCreateDefaultWorkshopId`
  creates one "My Workshop" per user. A real workshop selector / multi-workshop
  UI arrives with the Facilitator OS (Sprint 8).
- **`types/database.ts` is hand-authored** to match `supabase/migrations`. Once
  the Supabase CLI can reach the project, regenerate with
  `supabase gen types typescript` and delete the hand-maintained note.
- **supabase-js / ssr version pin.** `@supabase/ssr` was bumped to 0.12 to match
  the `SupabaseClient` generics in `@supabase/supabase-js` 2.108; older ssr made
  typed inserts resolve to `never`. Keep these two in lockstep on future bumps.

## Verification still owed (blocked by the sandbox network allowlist)

Sprint 1:

- Live create/read/update/delete of each question type against Supabase.
- Confirm RLS blocks cross-facilitator reads.
- Confirm `slide_links` is written when a slide is selected in PowerPoint.

Sprint 2:

- Create a session; confirm `session_code` is unique and 6 chars.
- Scan the QR; confirm it resolves to `/join/[code]` (404 expected until Sprint 3).
- Start then end a session; confirm `status` transitions draft → active → ended.
- Confirm `check_session_code` returns a row only for an active code (anon role).
