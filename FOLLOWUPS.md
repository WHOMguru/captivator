# Follow-ups

Deferred items surfaced during sprint work. Keep this list short; promote items
into a sprint when they're scheduled.

## From Sprint 1 (Poll Authoring)

- **Facilitator auth is a temporary anonymous bootstrap.** `lib/supabase/ensure-session.ts`
  signs the facilitator in anonymously so RLS (`owner_id = auth.uid()`) works,
  because the sprint sequence has no login surface yet. This requires **Anonymous
  sign-ins** to be enabled in Supabase (Authentication → Providers). Replace with
  a real facilitator sign-in (email/OAuth) before V1 ship.
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

- Live create/read/update/delete of each question type against Supabase.
- Confirm RLS blocks cross-facilitator reads.
- Confirm `slide_links` is written when a slide is selected in PowerPoint.
