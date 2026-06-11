# Follow-ups

Deferred items surfaced during sprint work. Keep this list short; promote items
into a sprint when they're scheduled.

## Deferred verification

### PowerPoint add-in sideload — RESOLVED (2026-06-11)

The host-verification blocker is **resolved**. The add-in side-loads on the
primary user's machine after all, using the **Microsoft 365 Business Standard**
tenant the user administers (the earlier tenant/policy restriction and the dead
Developer-Program sandbox are no longer on the critical path). No contracted
developer was needed.

**How it was resolved (for future devs):**

- Side-load / deploy from a tenant you administer (Business Standard works). If a
  machine-level sideload policy ever blocks it again, use **Centralized
  Deployment**: M365 admin center → Settings → Integrated apps → Upload custom
  apps → point at the deployed `public/manifest.xml` and assign to a test group.
- For Centralized Deployment / AppSource the manifest `<Id>` must be a valid
  GUID (the original placeholder was not — fix before distributing).

**Verification status in the real host:**

- ✅ Sprint 0 — ribbon tab + task pane render; **Supabase and Office.js pills
  both green**.
- ✅ Sprint 5 — presenter controls render and the architecture works in-host.
- ⏳ Sprint 1 — "Link current slide" / `slide_links`: confirm after the add-in
  facilitator-auth fix ships (Bearer-token auth; see below).

**Related follow-up (facilitator auth in the add-in):** the add-in webview drops
cookies, so the facilitator API routes authenticate with the anonymous session's
**Bearer access token** instead (`lib/api.ts` + `lib/supabase/request-auth.ts`).
The anonymous session is in-memory only, so it does **not persist across task-pane
reloads** — each reload mints a fresh anonymous user (and a fresh default
workshop). Durable identity arrives with **Sprint 6.5 (Facilitator
Authentication)**; until then, treat each task-pane load as a fresh facilitator.

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
- Scan the QR; confirm it resolves to `/join/[code]`.
- Start then end a session; confirm `status` transitions draft → active → ended.
- Confirm `check_session_code` returns a row only for an active code (anon role).

Sprint 3:

- Join from a phone; submit one response of each type; confirm rows in `responses`.
- Load test ~50 concurrent submissions (k6/autocannon) against `/api/responses`.
- Confirm a participant cannot submit to a non-active session (409) or without the
  join cookie (401).
- Requires `SUPABASE_SERVICE_ROLE_KEY` set in the deployment (participant flows
  use the service-role admin client server-side).

Sprint 4:

- Open `/addin` (or `/dashboard`) and a participant tab; submit a response and
  confirm the visualization updates in under 1 second (`console.time`).
- Stress with ~50 rapid submissions; confirm charts keep up.
- Requires Realtime enabled: migration `0004` adds `responses` to the
  `supabase_realtime` publication. Confirm the facilitator only receives
  responses for their own sessions (RLS on the Realtime subscription).

Sprint 5:

- In PowerPoint, advance slides and confirm the task pane follows the linked
  question (slide-change handler).
- Run a full Launch → Close → Reveal → Hide cycle without leaving PowerPoint.
- Confirm Launch opens exactly one question (others close) and the participant
  view follows the open question; Reveal shows results to participants.
- Slide-change + four controls can only be exercised inside the PowerPoint host.
